/* eslint-disable camelcase */
import { mockDashboardConfig } from '~/__mocks__/mockDashboardConfig';
import { mockDataSciencePipelineApplicationK8sResource } from '~/__mocks__/mockDataSciencePipelinesApplicationK8sResource';
import { mockDscStatus } from '~/__mocks__/mockDscStatus';
import { mockK8sResourceList } from '~/__mocks__/mockK8sResourceList';
import { buildMockPipelineVersionV2 } from '~/__mocks__/mockPipelineVersionsProxy';
import { mockProjectK8sResource } from '~/__mocks__/mockProjectK8sResource';
import { mockRouteK8sResource } from '~/__mocks__/mockRouteK8sResource';
import { mockSecretK8sResource } from '~/__mocks__/mockSecretK8sResource';
import { mockStatus } from '~/__mocks__/mockStatus';
import { buildMockJobKF } from '~/__mocks__/mockJobKF';
import { mockPodLogs } from '~/__mocks__/mockPodLogs';
import {
  pipelineDetails,
  pipelineRunJobDetails,
  pipelineRunDetails,
} from '~/__tests__/cypress/cypress/pages/pipelines';
import { buildMockRunKF } from '~/__mocks__/mockRunKF';
import { mockPipelinePodK8sResource } from '~/__mocks__/mockPipelinePodK8sResource';
import { buildMockPipelineV2 } from '~/__mocks__';
import { verifyRelativeURL } from '~/__tests__/cypress/cypress/utils/url.cy';

const projectId = 'test-project';
const mockPipeline = buildMockPipelineV2({
  pipeline_id: 'test-pipeline',
  display_name: 'test-pipeline',
});
const mockVersion = buildMockPipelineVersionV2({
  pipeline_id: mockPipeline.pipeline_id,
  pipeline_version_id: 'test-version-id',
  display_name: 'test-version-name',
});
const mockRun = buildMockRunKF({
  display_name: 'test-pipeline-run',
  run_id: 'test-pipeline-run-id',
  pipeline_version_reference: {
    pipeline_id: mockPipeline.pipeline_id,
    pipeline_version_id: mockVersion.pipeline_version_id,
  },
});
const mockJob = buildMockJobKF({
  display_name: 'test-pipeline',
  recurring_run_id: 'test-pipeline',
  pipeline_version_reference: {
    pipeline_id: mockPipeline.pipeline_id,
    pipeline_version_id: mockVersion.pipeline_version_id,
  },
});

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
      pathname: '/api/k8s/apis/project.openshift.io/v1/projects',
    },
    mockK8sResourceList([mockProjectK8sResource({ k8sName: projectId })]),
  );
  cy.intercept(
    {
      pathname: `/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/${projectId}/datasciencepipelinesapplications/pipelines-definition`,
    },
    mockDataSciencePipelineApplicationK8sResource({ namespace: projectId }),
  );

  cy.intercept(
    {
      pathname: `/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/${projectId}/datasciencepipelinesapplications`,
    },
    mockK8sResourceList([mockDataSciencePipelineApplicationK8sResource({})]),
  );

  cy.intercept(
    {
      method: 'GET',
      pathname: `/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/${projectId}/datasciencepipelinesapplications/dspa`,
    },
    mockDataSciencePipelineApplicationK8sResource({}),
  );
  cy.intercept(
    {
      pathname: `/api/k8s/api/v1/namespaces/${projectId}/secrets/ds-pipeline-config`,
    },
    mockSecretK8sResource({ name: 'ds-pipeline-config' }),
  );
  cy.intercept(
    {
      pathname: `/api/k8s/api/v1/namespaces/${projectId}/secrets/aws-connection-testdb`,
    },
    mockSecretK8sResource({ name: 'aws-connection-testdb' }),
  );
  cy.intercept(
    {
      pathname: `/api/k8s/apis/route.openshift.io/v1/namespaces/${projectId}/routes/ds-pipeline-dspa`,
    },
    mockRouteK8sResource({
      notebookName: 'ds-pipeline-pipelines-definition',
      namespace: projectId,
    }),
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: '/api/proxy/apis/v2beta1/pipelines',
    },
    { pipelines: [mockPipeline] },
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/pipelines/${mockPipeline.pipeline_id}`,
    },
    mockPipeline,
  );

  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/recurringruns/${mockJob.recurring_run_id}`,
    },
    mockJob,
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/recurringruns`,
    },
    { recurringRuns: [mockJob] },
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/runs/${mockRun.run_id}`,
    },
    mockRun,
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/runs/`,
    },
    { runs: [mockRun] },
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/pipelines/${mockPipeline.pipeline_id}/versions`,
    },
    [mockVersion],
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: `/api/proxy/apis/v2beta1/pipelines/${mockPipeline.pipeline_id}/versions/${mockVersion.pipeline_version_id}`,
    },
    mockVersion,
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: `/api/k8s/api/v1/namespaces/${projectId}/pods/iris-training-pipeline-v4zp7-2757091352`,
    },
    mockPipelinePodK8sResource({}),
  );

  cy.intercept(
    `/api/k8s/api/v1/namespaces/${projectId}/pods/iris-training-pipeline-v4zp7-2757091352/log?container=step-main&tailLines=500`,
    mockPodLogs({
      namespace: projectId,
      podName: 'iris-training-pipeline-v4zp7-2757091352',
      containerName: 'step-main',
    }),
  );
};

describe('Pipeline topology', () => {
  describe('Pipeline details', () => {
    describe('Navigation', () => {
      beforeEach(() => {
        initIntercepts();
      });

      it('Test pipeline details create run navigation', () => {
        pipelineDetails.visit(projectId, mockVersion.pipeline_id, mockVersion.pipeline_version_id);
        pipelineDetails.findActionsDropdown().click();
        cy.findByText('Create run').click();
        verifyRelativeURL(`/pipelineRuns/${projectId}/pipelineRun/create`);
      });

      it('navigates to "Schedule run" page on "Schedule run" click', () => {
        pipelineDetails.visit(projectId, mockVersion.pipeline_id, mockVersion.pipeline_version_id);
        pipelineDetails.findActionsDropdown().click();
        cy.findByText('Schedule run').click();
        verifyRelativeURL(`/pipelineRuns/${projectId}/pipelineRun/create?runType=scheduled`);
      });

      it('Test pipeline details view runs navigation', () => {
        pipelineDetails.visit(projectId, mockVersion.pipeline_id, mockVersion.pipeline_version_id);
        pipelineDetails.findActionsDropdown().click();
        cy.findByText('View runs').click();
        verifyRelativeURL(`/pipelineRuns/${projectId}?runType=active`);
      });

      it('navigates to "Schedules" on "View schedules" click', () => {
        pipelineDetails.visit(projectId, mockVersion.pipeline_id, mockVersion.pipeline_version_id);
        pipelineDetails.findActionsDropdown().click();
        cy.findByText('View schedules').click();
        verifyRelativeURL(`/pipelineRuns/${projectId}?runType=scheduled`);
      });
    });
  });

  describe('Pipeline run details', () => {
    describe('Navigation', () => {
      beforeEach(() => {
        initIntercepts();
      });

      it('Test pipeline run duplicate navigation', () => {
        pipelineRunDetails.visit(projectId, mockRun.run_id);
        pipelineRunDetails.findActionsDropdown().click();
        cy.findByText('Duplicate').click();
        verifyRelativeURL(`/pipelineRuns/${projectId}/pipelineRun/clone/${mockRun.run_id}`);
      });

      it('Test pipeline job duplicate navigation', () => {
        pipelineRunJobDetails.visit(projectId, mockJob.recurring_run_id);
        pipelineRunJobDetails.findActionsDropdown().click();
        cy.findByText('Duplicate run').click();
        verifyRelativeURL(
          `/pipelineRuns/${projectId}/pipelineRun/cloneJob/${mockJob.recurring_run_id}?runType=scheduled`,
        );
      });

      it('Test pipeline job bottom drawer project navigation', () => {
        pipelineRunJobDetails.visit(projectId, mockJob.recurring_run_id);

        pipelineRunJobDetails.findBottomDrawer().findBottomDrawerDetailsTab().click();
        pipelineRunJobDetails
          .findBottomDrawer()
          .findBottomDrawerDetailItem('Project')
          .findValue()
          .find('a')
          .click();
        verifyRelativeURL(`/projects/${projectId}`);
      });

      it('Test pipeline job bottom drawer pipeline version navigation', () => {
        pipelineRunJobDetails.visit(projectId, mockJob.recurring_run_id);

        pipelineRunJobDetails.findBottomDrawer().findBottomDrawerDetailsTab().click();
        pipelineRunJobDetails
          .findBottomDrawer()
          .findBottomDrawerDetailItem('Pipeline version')
          .findValue()
          .find('a')
          .click();
        verifyRelativeURL(
          `/pipelines/${projectId}/pipeline/view/${mockJob.pipeline_version_reference.pipeline_id}/${mockJob.pipeline_version_reference.pipeline_version_id}`,
        );
      });
    });

    it('Test pipeline job bottom drawer details', () => {
      initIntercepts();

      pipelineRunJobDetails.visit(projectId, mockJob.recurring_run_id);

      pipelineRunJobDetails.findBottomDrawer().findBottomDrawerDetailsTab().click();
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Name')
        .findValue()
        .contains(mockJob.display_name);
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Project')
        .findValue()
        .contains('Test Project');
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Run ID')
        .findValue()
        .contains(mockJob.display_name);
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Workflow name')
        .findValue()
        .contains('test-pipeline');
    });

    it('Test pipeline job bottom drawer parameters', () => {
      initIntercepts();

      pipelineRunJobDetails.visit(projectId, mockJob.recurring_run_id);

      pipelineRunJobDetails.findBottomDrawer().findBottomDrawerInputTab().click();
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('min_max_scaler')
        .findValue()
        .contains('False');
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('neighbors')
        .findValue()
        .contains('0');
      pipelineRunJobDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('standard_scaler')
        .findValue()
        .contains('yes');
    });

    it('Test pipeline triggered run bottom drawer details', () => {
      initIntercepts();

      pipelineRunDetails.visit(projectId, mockRun.run_id);

      pipelineRunJobDetails.findBottomDrawer().findBottomDrawerYamlTab();
      pipelineRunDetails.findBottomDrawer().findBottomDrawerDetailsTab().click();
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Name')
        .findValue()
        .contains(mockJob.display_name);
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Project')
        .findValue()
        .contains('Test Project');
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Run ID')
        .findValue()
        .contains(mockJob.display_name);
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('Workflow name')
        .findValue()
        .contains('test-pipeline');
    });

    it('Test pipeline triggered run bottom drawer parameters', () => {
      initIntercepts();

      pipelineRunDetails.visit(projectId, mockRun.run_id);

      pipelineRunDetails.findBottomDrawer().findBottomDrawerInputTab().click();
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('min_max_scaler')
        .findValue()
        .contains('False');
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('neighbors')
        .findValue()
        .contains('1');
      pipelineRunDetails
        .findBottomDrawer()
        .findBottomDrawerDetailItem('standard_scaler')
        .findValue()
        .contains('False');
    });
  });

  describe('Pipelines logs', () => {
    beforeEach(() => {
      initIntercepts();
      pipelineRunDetails.visit(projectId, mockRun.run_id);
      pipelineRunDetails.findTaskNode('create-dataset').click();
      pipelineRunDetails.findRightDrawer().findRightDrawerDetailsTab().should('be.visible');
      pipelineRunDetails.findRightDrawer().findRightDrawerLogsTab().should('be.visible');
      pipelineRunDetails.findRightDrawer().findRightDrawerLogsTab().click();
      pipelineRunDetails.findLogsSuccessAlert().should('be.visible');
    });

    it('test whether the logs load in Logs tab', () => {
      pipelineRunDetails
        .findLogs()
        .contains(
          'sample log for namespace test-project, pod name iris-training-pipeline-v4zp7-2757091352 and for step step-main',
        );
      // test whether single step logs download dropdown item is enabled when logs are available
      pipelineRunDetails.findDownloadStepsToggle().click();
      pipelineRunDetails.findCurrentStepLogs().should('not.be.disabled');
      pipelineRunDetails.findDownloadStepsToggle().click();
      pipelineRunDetails.findCurrentStepLogs().should('not.exist');
      // test whether the raw logs dropddown item is enabled when logs are available
      pipelineRunDetails.findLogsKebabToggle().click();
      pipelineRunDetails.findRawLogs().should('not.be.disabled');
      pipelineRunDetails.findLogsKebabToggle().click();
      pipelineRunDetails.findRawLogs().should('not.exist');
    });

    it('test logs of another step', () => {
      pipelineRunDetails.findStepSelect().should('not.be.disabled');
      pipelineRunDetails.selectStepByName('step-copy-artifacts');
      pipelineRunDetails.findLogs().contains('No logs available');
      // test whether single step logs download dropdown item is disabled when logs are not available
      pipelineRunDetails.findDownloadStepsToggle().click();
      pipelineRunDetails.findCurrentStepLogs().should('not.be.enabled');
      pipelineRunDetails.findDownloadStepsToggle().click();
      // test whether the raw logs dropddown item is disabled when logs are not available
      pipelineRunDetails.findLogsKebabToggle().click();
      pipelineRunDetails.findRawLogs().should('not.be.enabled');
      pipelineRunDetails.findLogsKebabToggle().click();
    });
  });
});
