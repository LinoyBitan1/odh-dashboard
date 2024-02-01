import { mockDashboardConfig } from '~/__mocks__/mockDashboardConfig';
import { mockDscStatus } from '~/__mocks__/mockDscStatus';
import {
  mockInferenceServiceK8sResource,
  mockInferenceServicek8sError,
} from '~/__mocks__/mockInferenceServiceK8sResource';
import { mockK8sResourceList } from '~/__mocks__/mockK8sResourceList';
import { mockProjectK8sResource } from '~/__mocks__/mockProjectK8sResource';
import { mockSecretK8sResource } from '~/__mocks__/mockSecretK8sResource';
import { mockServingRuntimeK8sResource } from '~/__mocks__/mockServingRuntimeK8sResource';
import {
  mockInvalidTemplateK8sResource,
  mockServingRuntimeTemplateK8sResource,
} from '~/__mocks__/mockServingRuntimeTemplateK8sResource';
import { mockStatus } from '~/__mocks__/mockStatus';
import { deleteModal } from '~/__tests__/cypress/cypress/pages/components/DeleteModal';
import {
  inferenceServiceModal,
  modelServingGlobal,
} from '~/__tests__/cypress/cypress/pages/modelServing';
import { InferenceServiceKind, ServingRuntimeKind } from '~/k8sTypes';
import { ServingRuntimePlatform } from '~/types';

type HandlersProps = {
  disableKServeConfig?: boolean;
  disableModelMeshConfig?: boolean;
  projectEnableModelMesh?: boolean;
  servingRuntimes?: ServingRuntimeKind[];
  inferenceServices?: InferenceServiceKind[];
  delayInferenceServices?: boolean;
};

const initIntercepts = ({
  disableKServeConfig,
  disableModelMeshConfig,
  projectEnableModelMesh,
  servingRuntimes = [mockServingRuntimeK8sResource({})],
  inferenceServices = [mockInferenceServiceK8sResource({})],
  delayInferenceServices,
}: HandlersProps) => {
  cy.intercept(
    '/api/dsc/status',
    mockDscStatus({
      installedComponents: { kserve: true, 'model-mesh': true },
    }),
  );
  cy.intercept('/api/status', mockStatus());
  cy.intercept(
    '/api/config',
    mockDashboardConfig({
      disableKServe: disableKServeConfig,
      disableModelMesh: disableModelMeshConfig,
    }),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/serving.kserve.io/v1alpha1/namespaces/test-project/servingruntimes',
    },
    mockK8sResourceList(servingRuntimes),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices',
    },
    mockK8sResourceList(inferenceServices),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/api/v1/namespaces/test-project/secrets',
    },
    mockK8sResourceList([mockSecretK8sResource({})]),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/serving.kserve.io/v1alpha1/namespaces/modelServing/servingruntimes',
    },
    mockK8sResourceList(servingRuntimes),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/serving.kserve.io/v1alpha1/servingruntimes',
    },
    mockK8sResourceList(servingRuntimes),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/modelServing/inferenceservices',
    },
    mockK8sResourceList(inferenceServices),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/serving.kserve.io/v1beta1/inferenceservices',
    },
    {
      delay: delayInferenceServices ? 1000 : 0,
      body: mockK8sResourceList(inferenceServices),
    },
  );
  cy.intercept(
    {
      method: 'POST',
      pathname: '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices',
    },
    { statusCode: 500 },
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/api/v1/namespaces/modelServing/secrets',
    },
    mockK8sResourceList([mockSecretK8sResource({})]),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname:
        '/api/k8s/apis/serving.kserve.io/v1alpha1/namespaces/test-project/servingruntimes/test-model',
    },
    mockServingRuntimeK8sResource({}),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/project.openshift.io/v1/projects',
    },
    mockK8sResourceList([mockProjectK8sResource({ enableModelMesh: projectEnableModelMesh })]),
  );
  cy.intercept(
    {
      method: 'POST',
      pathname:
        '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices/test',
    },
    mockInferenceServiceK8sResource({}),
  );

  cy.intercept(
    {
      method: 'POST',
      pathname:
        '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices/trigger-error',
    },
    { statusCode: 422, body: mockInferenceServicek8sError() },
  );
  cy.intercept(
    {
      method: 'GET',
      pathname:
        '/api/k8s/apis/opendatahub.io/v1alpha/namespaces/opendatahub/odhdashboardconfigs/odh-dashboard-config',
    },
    mockDashboardConfig({}),
  );
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/k8s/apis/template.openshift.io/v1/namespaces/opendatahub/templates',
    },
    mockK8sResourceList([
      mockServingRuntimeTemplateK8sResource({
        name: 'template-1',
        displayName: 'Multi Platform',
        platforms: [ServingRuntimePlatform.SINGLE, ServingRuntimePlatform.MULTI],
      }),
      mockServingRuntimeTemplateK8sResource({
        name: 'template-2',
        displayName: 'Caikit',
        platforms: [ServingRuntimePlatform.SINGLE],
      }),
      mockServingRuntimeTemplateK8sResource({
        name: 'template-3',
        displayName: 'New OVMS Server',
        platforms: [ServingRuntimePlatform.MULTI],
      }),
      mockServingRuntimeTemplateK8sResource({
        name: 'template-4',
        displayName: 'Serving Runtime with No Annotations',
      }),
      mockInvalidTemplateK8sResource({}),
    ]),
  );
};

describe('Model Serving Global', () => {
  it('Empty State No Serving Runtime', () => {
    initIntercepts({
      disableKServeConfig: false,
      disableModelMeshConfig: false,
      projectEnableModelMesh: true,
      servingRuntimes: [],
      inferenceServices: [],
    });

    modelServingGlobal.visit('test-project');

    modelServingGlobal.shouldBeEmpty();

    // Test that the button is enabled
    modelServingGlobal.findGoToProjectButton().should('be.enabled');
  });

  it('Empty State No Inference Service', () => {
    initIntercepts({
      projectEnableModelMesh: false,
      inferenceServices: [],
    });

    modelServingGlobal.visit('test-project');

    modelServingGlobal.shouldBeEmpty();

    // Test that the button is enabled
    modelServingGlobal.findDeployModelButton().click();

    // test that you can not submit on empty
    inferenceServiceModal.shouldBeOpen();
    inferenceServiceModal.findSubmitButton().should('be.disabled');
  });

  it('All projects loading', () => {
    initIntercepts({ delayInferenceServices: true, servingRuntimes: [], inferenceServices: [] });

    // Visit the all-projects view (no project name passed here)
    modelServingGlobal.visit();

    modelServingGlobal.shouldWaitAndCancel();

    modelServingGlobal.shouldBeEmpty();
  });

  it('Empty State No Project Selected', () => {
    initIntercepts({ inferenceServices: [] });

    // Visit the all-projects view (no project name passed here)
    modelServingGlobal.visit();

    modelServingGlobal.shouldBeEmpty();

    // Test that the button is disabled
    modelServingGlobal.findDeployModelButton().should('have.attr', 'aria-disabled');

    // Test that the tooltip appears on hover of the disabled button
    modelServingGlobal.findDeployModelButton().trigger('mouseenter');
    modelServingGlobal.findNoProjectSelectedTooltip().should('be.visible');
  });

  it('Delete model', () => {
    initIntercepts({});
    modelServingGlobal.visit('test-project');

    // user flow for deleting a project
    modelServingGlobal
      .findModelRow('Test Inference Service')
      .findKebabAction(/^Delete/)
      .click();

    // Test that can submit on valid form
    deleteModal.shouldBeOpen();
    deleteModal.findSubmitButton().should('be.disabled');

    deleteModal.findInput().type('Test Inference Service');
    deleteModal.findSubmitButton().should('be.enabled');

    // add trailing space
    deleteModal.findInput().type(' ');
    deleteModal.findSubmitButton().should('be.disabled');
  });

  it('Edit model', () => {
    initIntercepts({});
    modelServingGlobal.visit('test-project');

    // user flow for editing a project
    modelServingGlobal.findModelRow('Test Inference Service').findKebabAction('Edit').click();

    // test that you can not submit on empty
    inferenceServiceModal.shouldBeOpen();
    inferenceServiceModal.findModelNameInput().clear();
    inferenceServiceModal.findLocationPathInput().clear();
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    inferenceServiceModal.findLocationPathInput().type('/');
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    // test that you can update the name to a different name
    inferenceServiceModal.findModelNameInput().type('Updated Model Name');
    inferenceServiceModal.findLocationPathInput().type('test-model/');
    inferenceServiceModal.findSubmitButton().should('be.enabled');

    // test that user cant upload on an empty new secret
    inferenceServiceModal.findNewDataConnectionOption().click();
    inferenceServiceModal.findLocationPathInput().clear();
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    inferenceServiceModal.findLocationPathInput().type('/');
    inferenceServiceModal.findSubmitButton().should('be.disabled');

    // test that adding required values validates submit
    inferenceServiceModal.findLocationNameInput().type('Test Name');
    inferenceServiceModal.findLocationAccessKeyInput().type('test-key');
    inferenceServiceModal.findLocationSecretKeyInput().type('test-secret-key');
    inferenceServiceModal.findLocationEndpointInput().type('test-endpoint');
    inferenceServiceModal.findLocationBucketInput().type('test-bucket');
    inferenceServiceModal.findLocationPathInput().type('test-model/');
    inferenceServiceModal.findSubmitButton().should('be.enabled');
  });

  it('Create model', () => {
    initIntercepts({
      projectEnableModelMesh: true,
    });
    modelServingGlobal.visit('test-project');

    modelServingGlobal.findDeployModelButton().click();

    // test that you can not submit on empty
    inferenceServiceModal.shouldBeOpen();
    inferenceServiceModal.findSubmitButton().should('be.disabled');

    // test filling in minimum required fields
    inferenceServiceModal.findModelNameInput().type('Test Name');
    inferenceServiceModal.findServingRuntimeSelect().findSelectOption('OVMS Model Serving').click();
    inferenceServiceModal.findModelFrameworkSelect().findSelectOption('onnx - 1').click();
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    inferenceServiceModal.findExistingConnectionSelect().findSelectOption('Test Secret').click();
    inferenceServiceModal.findLocationPathInput().type('test-model/');
    inferenceServiceModal.findSubmitButton().should('be.enabled');
    inferenceServiceModal.findNewDataConnectionOption().click();
    inferenceServiceModal.findLocationPathInput().clear();
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    inferenceServiceModal.findLocationPathInput().type('/');
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    inferenceServiceModal.findLocationNameInput().type('Test Name');
    inferenceServiceModal.findLocationAccessKeyInput().type('test-key');
    inferenceServiceModal.findLocationSecretKeyInput().type('test-secret-key');
    inferenceServiceModal.findLocationEndpointInput().type('test-endpoint');
    inferenceServiceModal.findLocationBucketInput().type('test-bucket');
    inferenceServiceModal.findLocationPathInput().type('test-model/');
    inferenceServiceModal.findSubmitButton().should('be.enabled');
  });

  it('Create model error', () => {
    initIntercepts({
      projectEnableModelMesh: true,
    });
    modelServingGlobal.visit('test-project');

    modelServingGlobal.findDeployModelButton().click();

    // test that you can not submit on empty
    inferenceServiceModal.shouldBeOpen();
    inferenceServiceModal.findSubmitButton().should('be.disabled');

    // test filling in minimum required fields
    inferenceServiceModal.findModelNameInput().type('trigger-error');
    inferenceServiceModal.findServingRuntimeSelect().findSelectOption('OVMS Model Serving').click();
    inferenceServiceModal.findModelFrameworkSelect().findSelectOption('onnx - 1').click();
    inferenceServiceModal.findSubmitButton().should('be.disabled');
    inferenceServiceModal.findExistingConnectionSelect().findSelectOption('Test Secret').click();
    inferenceServiceModal.findLocationPathInput().type('test-model/');
    inferenceServiceModal.findSubmitButton().should('be.enabled');
    inferenceServiceModal.findLocationPathInput().type('test-model/');
    inferenceServiceModal.findSubmitButton().should('be.enabled');

    // Submit and check the invalid error message
    inferenceServiceModal.findSubmitButton().click();
    cy.findByText('Error creating model server');

    // Close the modal
    inferenceServiceModal.findCancelButton().click();

    // Check that the error message is gone
    modelServingGlobal.findDeployModelButton().click();
    cy.findByText('Error creating model server').should('not.exist');
  });
});
