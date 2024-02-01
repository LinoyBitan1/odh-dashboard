import { mockAcceleratorProfile } from '~/__mocks__/mockAcceleratorProfile';
import { mockInferenceServiceModalData } from '~/__mocks__/mockInferenceServiceModalData';
import { assembleInferenceService } from '~/api/k8s/inferenceServices';
import { translateDisplayNameForK8s } from '~/pages/projects/utils';
import { AcceleratorProfileState } from '~/utilities/useAcceleratorProfileState';

global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));

describe('assembleInferenceService', () => {
  it('should have the right annotations when creating for Kserve', async () => {
    const inferenceService = assembleInferenceService(mockInferenceServiceModalData({}));

    expect(inferenceService.metadata.annotations).toBeDefined();
    expect(inferenceService.metadata.annotations?.['serving.kserve.io/deploymentMode']).toBe(
      undefined,
    );
    expect(
      inferenceService.metadata.annotations?.['serving.knative.openshift.io/enablePassthrough'],
    ).toBe('true');
    expect(inferenceService.metadata.annotations?.['sidecar.istio.io/inject']).toBe('true');
    expect(inferenceService.metadata.annotations?.['sidecar.istio.io/rewriteAppHTTPProbers']).toBe(
      'true',
    );
  });

  it('should have the right annotations when creating for modelmesh', async () => {
    const inferenceService = assembleInferenceService(
      mockInferenceServiceModalData({}),
      undefined,
      undefined,
      true,
    );

    expect(inferenceService.metadata.annotations).toBeDefined();
    expect(inferenceService.metadata.annotations?.['serving.kserve.io/deploymentMode']).toBe(
      'ModelMesh',
    );
    expect(
      inferenceService.metadata.annotations?.['serving.knative.openshift.io/enablePassthrough'],
    ).toBe(undefined);
    expect(inferenceService.metadata.annotations?.['sidecar.istio.io/inject']).toBe(undefined);
    expect(inferenceService.metadata.annotations?.['sidecar.istio.io/rewriteAppHTTPProbers']).toBe(
      undefined,
    );
  });

  it('should handle name and display name', async () => {
    const displayName = 'Llama model';

    const inferenceService = assembleInferenceService(
      mockInferenceServiceModalData({ name: displayName }),
    );

    expect(inferenceService.metadata.annotations).toBeDefined();
    expect(inferenceService.metadata.annotations?.['openshift.io/display-name']).toBe(displayName);
    expect(inferenceService.metadata.name).toBe(translateDisplayNameForK8s(displayName));
  });

  it('should add accelerator if kserve and accelerator found', async () => {
    const acceleratorProfileState: AcceleratorProfileState = {
      acceleratorProfile: mockAcceleratorProfile({}),
      acceleratorProfiles: [mockAcceleratorProfile({})],
      initialAcceleratorProfile: mockAcceleratorProfile({}),
      count: 1,
      additionalOptions: {},
      useExisting: false,
    };

    const inferenceService = assembleInferenceService(
      mockInferenceServiceModalData({}),
      undefined,
      undefined,
      false,
      undefined,
      acceleratorProfileState,
    );

    expect(inferenceService.spec.predictor.tolerations).toBeDefined();
    expect(inferenceService.spec.predictor.tolerations?.[0].key).toBe(
      mockAcceleratorProfile({}).spec.tolerations?.[0].key,
    );
    expect(inferenceService.spec.predictor.model.resources?.limits?.['nvidia.com/gpu']).toBe(1);
    expect(inferenceService.spec.predictor.model.resources?.requests?.['nvidia.com/gpu']).toBe(1);
  });

  it('should not add accelerator if modelmesh and accelerator found', async () => {
    const acceleratorProfileState: AcceleratorProfileState = {
      acceleratorProfile: mockAcceleratorProfile({}),
      acceleratorProfiles: [mockAcceleratorProfile({})],
      initialAcceleratorProfile: mockAcceleratorProfile({}),
      count: 1,
      additionalOptions: {},
      useExisting: false,
    };

    const inferenceService = assembleInferenceService(
      mockInferenceServiceModalData({}),
      undefined,
      undefined,
      true,
      undefined,
      acceleratorProfileState,
    );

    expect(inferenceService.spec.predictor.tolerations).toBeUndefined();
    expect(inferenceService.spec.predictor.model.resources).toBeUndefined();
  });

  it('should provide max and min replicas if provided', async () => {
    const replicaCount = 2;

    const acceleratorProfileState: AcceleratorProfileState = {
      acceleratorProfile: mockAcceleratorProfile({}),
      acceleratorProfiles: [mockAcceleratorProfile({})],
      initialAcceleratorProfile: mockAcceleratorProfile({}),
      count: 1,
      additionalOptions: {},
      useExisting: false,
    };

    const inferenceService = assembleInferenceService(
      mockInferenceServiceModalData({}),
      undefined,
      undefined,
      true,
      undefined,
      acceleratorProfileState,
      replicaCount,
    );

    expect(inferenceService.spec.predictor.maxReplicas).toBe(replicaCount);
    expect(inferenceService.spec.predictor.minReplicas).toBe(replicaCount);
  });

  it('should omit replica count if not provided', async () => {
    const acceleratorProfileState: AcceleratorProfileState = {
      acceleratorProfile: mockAcceleratorProfile({}),
      acceleratorProfiles: [mockAcceleratorProfile({})],
      initialAcceleratorProfile: mockAcceleratorProfile({}),
      count: 1,
      additionalOptions: {},
      useExisting: false,
    };

    const inferenceService = assembleInferenceService(
      mockInferenceServiceModalData({}),
      undefined,
      undefined,
      true,
      undefined,
      acceleratorProfileState,
    );

    expect(inferenceService.spec.predictor.maxReplicas).toBeUndefined();
    expect(inferenceService.spec.predictor.minReplicas).toBeUndefined();
  });
});
