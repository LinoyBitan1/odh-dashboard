/* eslint-disable camelcase */
import { buildMockPipelineVersionV2, buildMockPipelineVersionsV2 } from '~/__mocks__';
import { mockDashboardConfig } from '~/__mocks__/mockDashboardConfig';
import { mockDataSciencePipelineApplicationK8sResource } from '~/__mocks__/mockDataSciencePipelinesApplicationK8sResource';
import { mockDscStatus } from '~/__mocks__/mockDscStatus';
import { mockK8sResourceList } from '~/__mocks__/mockK8sResourceList';
import { mock404Error } from '~/__mocks__/mockK8sStatus';
import { mockNotebookK8sResource } from '~/__mocks__/mockNotebookK8sResource';
import { mockPVCK8sResource } from '~/__mocks__/mockPVCK8sResource';
import { buildMockPipelineV2, buildMockPipelines } from '~/__mocks__/mockPipelinesProxy';
import { mockPodK8sResource } from '~/__mocks__/mockPodK8sResource';
import { mockProjectK8sResource } from '~/__mocks__/mockProjectK8sResource';
import { mockRouteK8sResource } from '~/__mocks__/mockRouteK8sResource';
import { mockSecretK8sResource } from '~/__mocks__/mockSecretK8sResource';
import { mockStatus } from '~/__mocks__/mockStatus';
import { pipelinesTable } from '~/__tests__/cypress/cypress/pages/pipelines';
import { pipelinesSection } from '~/__tests__/cypress/cypress/pages/pipelines/pipelinesSection';
import { projectDetails } from '~/__tests__/cypress/cypress/pages/projects';
import { verifyRelativeURL } from '~/__tests__/cypress/cypress/utils/url.cy';

const initialMockPipeline = buildMockPipelineV2({ display_name: 'Test pipeline' });
const initialMockPipelineVersion = buildMockPipelineVersionV2({
  pipeline_id: initialMockPipeline.pipeline_id,
});

const initIntercepts = () => {
  cy.intercept(
    '/api/dsc/status',
    mockDscStatus({ installedComponents: { 'data-science-pipelines-operator': true } }),
  );
  cy.intercept('/api/status', mockStatus());
  cy.intercept('/api/config', mockDashboardConfig({ disableModelServing: true }));
  cy.intercept(
    { pathname: '/api/k8s/api/v1/namespaces/test-project/pods' },
    mockK8sResourceList([mockPodK8sResource({})]),
  );
  cy.intercept(
    {
      pathname: '/api/k8s/apis/route.openshift.io/v1/namespaces/test-project/routes/test-notebook',
    },
    mockRouteK8sResource({}),
  );
  cy.intercept(
    { pathname: '/api/k8s/apis/kubeflow.org/v1/namespaces/test-project/notebooks' },
    mockK8sResourceList([mockNotebookK8sResource({})]),
  );
  cy.intercept(
    { pathname: '/api/k8s/apis/project.openshift.io/v1/projects' },
    mockK8sResourceList([mockProjectK8sResource({})]),
  );
  cy.intercept(
    { pathname: '/api/k8s/api/v1/namespaces/test-project/persistentvolumeclaims' },
    mockK8sResourceList([mockPVCK8sResource({})]),
  );
  cy.intercept(
    { pathname: '/api/k8s/apis/project.openshift.io/v1/projects/test-project' },
    mockProjectK8sResource({}),
  );
  cy.intercept(
    { pathname: '/api/k8s/api/v1/namespaces/test-project/secrets' },
    mockK8sResourceList([mockSecretK8sResource({})]),
  );
  cy.intercept(
    {
      pathname: `/api/k8s/apis/route.openshift.io/v1/namespaces/test-project/routes/ds-pipeline-dspa`,
    },
    mockRouteK8sResource({
      notebookName: 'ds-pipeline-dspa',
    }),
  );
};

describe('PipelinesList', () => {
  it('should show the configure pipeline server button when the server is not configured', () => {
    initIntercepts();
    cy.intercept(
      {
        pathname: `/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/test-project/datasciencepipelinesapplications/pipelines-definition`,
      },
      {
        statusCode: 404,
        body: mock404Error({}),
      },
    );

    projectDetails.visitSection('test-project', 'pipelines-projects');

    pipelinesSection.findCreatePipelineButton().should('be.enabled');
  });

  it('should disable the upload version button when the list is empty', () => {
    initIntercepts();
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
        method: 'POST',
        pathname: '/api/proxy/apis/v2beta1/pipelines',
      },
      buildMockPipelines([]),
    ).as('pipelines');
    projectDetails.visitSection('test-project', 'pipelines-projects');

    pipelinesSection.findImportPipelineSplitButton().should('be.enabled').click();

    cy.wait('@pipelines').then((interception) => {
      expect(interception.request.body).to.eql({
        path: '/apis/v2beta1/pipelines',
        method: 'GET',
        host: 'https://ds-pipeline-dspa-test-project.apps.user.com',
        queryParams: { sort_by: 'created_at desc', page_size: 5 },
      });
    });

    pipelinesSection.findUploadVersionButton().should('have.attr', 'aria-disabled', 'true');
  });

  it('should show the ability to delete the pipeline server kebab option', () => {
    initIntercepts();
    cy.intercept(
      {
        pathname:
          '/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/test-project/datasciencepipelinesapplications',
      },
      mockK8sResourceList([mockDataSciencePipelineApplicationK8sResource({ dspVersion: 'v1' })]),
    );
    cy.intercept(
      {
        method: 'GET',
        pathname:
          '/api/k8s/apis/datasciencepipelinesapplications.opendatahub.io/v1alpha1/namespaces/test-project/datasciencepipelinesapplications/dspa',
      },
      mockDataSciencePipelineApplicationK8sResource({ dspVersion: 'v1' }),
    );
    projectDetails.visitSection('test-project', 'pipelines-projects');

    pipelinesSection.findAllActions().should('have.length', 1);
    pipelinesSection.findImportPipelineSplitButton().should('not.exist');
    pipelinesSection.findKebabActions().should('be.visible').should('be.enabled');
    pipelinesSection.findKebabActionItem('Delete pipeline server').should('be.visible');
  });

  it('should navigate to details page when clicking on the version name', () => {
    initIntercepts();
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
        pathname: '/api/proxy/apis/v2beta1/pipelines',
      },
      buildMockPipelines([initialMockPipeline]),
    );

    cy.intercept(
      {
        method: 'POST',
        pathname: `/api/proxy/apis/v2beta1/pipelines/${initialMockPipeline.pipeline_id}/versions`,
      },
      buildMockPipelineVersionsV2([initialMockPipelineVersion]),
    );
    projectDetails.visitSection('test-project', 'pipelines-projects');

    pipelinesTable.find();
    pipelinesTable.getRowByName(initialMockPipeline.display_name).toggleExpandByIndex(0);
    pipelinesTable
      .getRowByName(initialMockPipelineVersion.display_name)
      .findPipelineName(initialMockPipelineVersion.display_name)
      .click();
    verifyRelativeURL(
      `/projects/test-project/pipeline/view/${initialMockPipeline.pipeline_id}/${initialMockPipelineVersion.pipeline_version_id}`,
    );
  });
});
