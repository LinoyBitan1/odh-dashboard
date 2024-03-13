/* eslint-disable camelcase */
import { mockDashboardConfig } from '~/__mocks__/mockDashboardConfig';
import { mockDataSciencePipelineApplicationK8sResource } from '~/__mocks__/mockDataSciencePipelinesApplicationK8sResource';
import { mockDscStatus } from '~/__mocks__/mockDscStatus';
import { mockK8sResourceList } from '~/__mocks__/mockK8sResourceList';
import { mockNotebookK8sResource } from '~/__mocks__/mockNotebookK8sResource';
import { mockPipelineKFv2 } from '~/__mocks__/mockPipelineKF';
import { buildMockJobKF } from '~/__mocks__/mockJobKF';
import { mockProjectK8sResource } from '~/__mocks__/mockProjectK8sResource';
import { mockRouteK8sResource } from '~/__mocks__/mockRouteK8sResource';
import { mockSecretK8sResource } from '~/__mocks__/mockSecretK8sResource';
import { mockStatus } from '~/__mocks__/mockStatus';
import { buildMockRunKF } from '~/__mocks__/mockRunKF';
import {
  pipelineRunJobTable,
  pipelineRunsGlobal,
  archivedRunsTable,
  runsDeleteModal,
  schedulesDeleteModal,
} from '~/__tests__/cypress/cypress/pages/pipelines';

const initIntercepts = () => {
  cy.intercept('/api/status', mockStatus());
  cy.intercept('/api/config', mockDashboardConfig({}));
  cy.intercept(
    '/api/dsc/status',
    mockDscStatus({
      installedComponents: { 'data-science-pipelines-operator': true },
    }),
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: '/api/proxy/apis/v2beta1/pipelines/test-pipeline',
    },
    mockPipelineKFv2({}),
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: '/api/proxy/apis/v2beta1/recurringruns',
    },
    {
      recurringRuns: [
        buildMockJobKF({ display_name: 'test-pipeline', recurring_run_id: 'test-pipeline' }),
        buildMockJobKF({ display_name: 'other-pipeline', recurring_run_id: 'other-pipeline' }),
      ],
    },
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: '/api/proxy/apis/v2beta1/runs',
    },
    {
      runs: [
        buildMockRunKF({ display_name: 'test-pipeline', run_id: 'test-pipeline' }),
        buildMockRunKF({ display_name: 'other-pipeline', run_id: 'other-pipeline' }),
      ],
    },
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: '/api/proxy/apis/v2beta1/pipelines',
    },
    mockPipelineKFv2({}),
  );
  cy.intercept(
    {
      pathname:
        '/api/k8s/apis/route.openshift.io/v1/namespaces/test-project/routes/ds-pipeline-dspa',
    },
    mockRouteK8sResource({ notebookName: 'ds-pipeline-pipelines-definition' }),
  );
  cy.intercept(
    {
      pathname: '/api/k8s/api/v1/namespaces/test-project/secrets/ds-pipeline-config',
    },
    mockSecretK8sResource({ name: 'ds-pipeline-config' }),
  );
  cy.intercept(
    {
      pathname: '/api/k8s/api/v1/namespaces/test-project/secrets/pipelines-db-password',
    },
    mockSecretK8sResource({ name: 'pipelines-db-password' }),
  );
  cy.intercept(
    {
      pathname: '/api/k8s/api/v1/namespaces/test-project/secrets/aws-connection-testdb',
    },
    mockSecretK8sResource({ name: 'aws-connection-testdb' }),
  );
  cy.intercept(
    {
      pathname:
        '/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/test-project/datasciencepipelinesapplications',
    },
    mockK8sResourceList([mockDataSciencePipelineApplicationK8sResource({})]),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname:
        '/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/test-project/datasciencepipelinesapplications/dspa',
    },
    mockDataSciencePipelineApplicationK8sResource({}),
  );
  cy.intercept(
    {
      pathname: '/api/k8s/apis/kubeflow.org/v1/namespaces/test-project/notebooks',
    },
    mockK8sResourceList([mockNotebookK8sResource({})]),
  );
  cy.intercept(
    {
      pathname: '/api/k8s/apis/project.openshift.io/v1/projects',
    },
    mockK8sResourceList([mockProjectK8sResource({})]),
  );
};

describe('Pipeline runs', () => {
  describe('Test deleting runs', () => {
    it('Test delete a single schedule', () => {
      initIntercepts();

      pipelineRunsGlobal.visit('test-project');
      pipelineRunsGlobal.isApiAvailable();

      pipelineRunsGlobal.findSchedulesTab().click();
      pipelineRunJobTable.findRowByName('test-pipeline').findKebabAction('Delete').click();

      schedulesDeleteModal.shouldBeOpen();
      schedulesDeleteModal.findSubmitButton().should('be.disabled');
      schedulesDeleteModal.findInput().type('test-pipeline');
      schedulesDeleteModal.findSubmitButton().should('be.enabled');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/recurringruns/test-pipeline',
        },
        mockStatus(),
      ).as('postJobPipeline');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/recurringruns',
        },
        {
          recurringRuns: [
            buildMockJobKF({ recurring_run_id: 'other-pipeline', display_name: 'other-pipeline' }),
          ],
        },
      ).as('getRuns');

      schedulesDeleteModal.findSubmitButton().click();

      cy.wait('@postJobPipeline').then((intercept) => {
        expect(intercept.request.body).to.eql({
          path: '/apis/v2beta1/recurringruns/test-pipeline',
          method: 'DELETE',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {},
          data: {},
        });
      });
      cy.wait('@getRuns').then((interception) => {
        expect(interception.request.body).to.eql({
          path: '/apis/v2beta1/recurringruns',
          method: 'GET',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: { sort_by: 'created_at desc', page_size: 10 },
        });
        pipelineRunJobTable.findEmptyState().should('not.exist');
      });
    });

    it('Test delete multiple schedules', () => {
      initIntercepts();

      pipelineRunsGlobal.visit('test-project');
      pipelineRunsGlobal.isApiAvailable();

      pipelineRunsGlobal.findSchedulesTab().click();
      pipelineRunJobTable.findRowByName('test-pipeline').findByLabelText('Checkbox').click();
      pipelineRunJobTable.findRowByName('other-pipeline').findByLabelText('Checkbox').click();

      pipelineRunJobTable.findActionsKebab().findDropdownItem('Delete').click();

      schedulesDeleteModal.shouldBeOpen();
      schedulesDeleteModal.findSubmitButton().should('be.disabled');
      schedulesDeleteModal.findInput().type('Delete 2 schedules');
      schedulesDeleteModal.findSubmitButton().should('be.enabled');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/recurringruns/test-pipeline',
        },
        mockStatus(),
      ).as('postJobPipeline-1');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/recurringruns/other-pipeline',
        },
        mockStatus(),
      ).as('postJobPipeline-2');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/recurringruns',
        },
        { recurringRuns: [] },
      ).as('getRuns');

      schedulesDeleteModal.findSubmitButton().click();

      cy.wait('@postJobPipeline-1').then((intercept) => {
        expect(intercept.request.body).to.eql({
          path: '/apis/v2beta1/recurringruns/test-pipeline',
          method: 'DELETE',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {},
          data: {},
        });
      });

      cy.wait('@postJobPipeline-2').then((intercept) => {
        expect(intercept.request.body).to.eql({
          path: '/apis/v2beta1/recurringruns/other-pipeline',
          method: 'DELETE',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {},
          data: {},
        });
      });

      cy.wait('@getRuns').then((interception) => {
        expect(interception.request.body).of.eql({
          path: '/apis/v2beta1/recurringruns',
          method: 'GET',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: { sort_by: 'created_at desc', page_size: 10 },
        });

        pipelineRunJobTable.findEmptyState().should('exist');
      });
    });

    it('Test delete a single archived run', () => {
      initIntercepts();

      pipelineRunsGlobal.visit('test-project');
      pipelineRunsGlobal.isApiAvailable();

      pipelineRunsGlobal.findArchivedRunsTab().click();
      archivedRunsTable.findRowByName('test-pipeline').findKebabAction('Delete').click();

      runsDeleteModal.shouldBeOpen();
      runsDeleteModal.findSubmitButton().should('be.disabled');
      runsDeleteModal.findInput().type('test-pipeline');
      runsDeleteModal.findSubmitButton().should('be.enabled');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/runs/test-pipeline',
        },
        mockStatus(),
      ).as('postRunPipeline');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/runs',
        },
        { runs: [buildMockRunKF({ run_id: 'other-pipeline', display_name: 'other-pipeline' })] },
      ).as('getRuns');

      runsDeleteModal.findSubmitButton().click();

      cy.wait('@postRunPipeline').then((intercept) => {
        expect(intercept.request.body).to.eql({
          path: '/apis/v2beta1/runs/test-pipeline',
          method: 'DELETE',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {},
          data: {},
        });
      });
      cy.wait('@getRuns').then((interception) => {
        archivedRunsTable.findEmptyState().should('not.exist');
        expect(interception.request.body).to.eql({
          path: '/apis/v2beta1/runs',
          method: 'GET',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {
            sort_by: 'created_at desc',
            page_size: 10,
            filter:
              '{"predicates":[{"key":"storage_state","operation":"EQUALS","string_value":"AVAILABLE"}]}',
          },
        });
      });
    });

    it('Test delete multiple archived runs', () => {
      initIntercepts();

      pipelineRunsGlobal.visit('test-project');
      pipelineRunsGlobal.isApiAvailable();

      pipelineRunsGlobal.findArchivedRunsTab().click();
      archivedRunsTable.findRowByName('test-pipeline').findByLabelText('Checkbox').click();
      archivedRunsTable.findRowByName('other-pipeline').findByLabelText('Checkbox').click();

      archivedRunsTable.findActionsKebab().findDropdownItem('Delete').click();

      runsDeleteModal.shouldBeOpen();
      runsDeleteModal.findSubmitButton().should('be.disabled');
      runsDeleteModal.findInput().type('Delete 2 runs');
      runsDeleteModal.findSubmitButton().should('be.enabled');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/runs/test-pipeline',
        },
        mockStatus(),
      ).as('postRunPipeline-1');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/runs/other-pipeline',
        },
        mockStatus(),
      ).as('postRunPipeline-2');

      cy.intercept(
        {
          method: 'POST',
          pathname: '/api/proxy/apis/v2beta1/runs',
        },
        { runs: [] },
      ).as('getRuns');

      runsDeleteModal.findSubmitButton().click();

      cy.wait('@postRunPipeline-1').then((intercept) => {
        expect(intercept.request.body).to.eql({
          path: '/apis/v2beta1/runs/test-pipeline',
          method: 'DELETE',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {},
          data: {},
        });
      });

      cy.wait('@postRunPipeline-2').then((intercept) => {
        expect(intercept.request.body).to.eql({
          path: '/apis/v2beta1/runs/other-pipeline',
          method: 'DELETE',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {},
          data: {},
        });
      });
      cy.wait('@getRuns').then((interception) => {
        expect(interception.request.body).to.eql({
          path: '/apis/v2beta1/runs',
          method: 'GET',
          host: 'https://ds-pipeline-pipelines-definition-test-project.apps.user.com',
          queryParams: {
            sort_by: 'created_at desc',
            page_size: 10,
            filter:
              '{"predicates":[{"key":"storage_state","operation":"EQUALS","string_value":"AVAILABLE"}]}',
          },
        });
        archivedRunsTable.findEmptyState().should('exist');
      });
    });
  });
});
