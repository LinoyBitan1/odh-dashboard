import { mockAcceleratorProfile } from '~/__mocks__/mockAcceleratorProfile';
import { mockServingRuntimeK8sResource } from '~/__mocks__/mockServingRuntimeK8sResource';
import { mockServingRuntimeModalData } from '~/__mocks__/mockServingRuntimeModalData';
import { mockServingRuntimeTemplateK8sResource } from '~/__mocks__/mockServingRuntimeTemplateK8sResource';
import { assembleServingRuntime } from '~/api/k8s/servingRuntimes';
import { ServingRuntimeKind } from '~/k8sTypes';
import { AcceleratorProfileState } from '~/utilities/useAcceleratorProfileState';

global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));

describe('assembleServingRuntime', () => {
  it('should omit enable-xxxx annotations when creating', async () => {
    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: false,
        tokenAuth: false,
      }),
      'test',
      mockServingRuntimeTemplateK8sResource({}).objects[0] as ServingRuntimeKind,
      false,
      false, // isEditing
    );

    expect(servingRuntime.metadata.annotations).toBeDefined();
    expect(servingRuntime.metadata.annotations?.['enable-auth']).toBe(undefined);
    expect(servingRuntime.metadata.annotations?.['enable-route']).toBe(undefined);
  });

  it('should remove enable-xxxx annotations when editing', async () => {
    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: false,
        tokenAuth: false,
      }),
      'test',
      mockServingRuntimeK8sResource({ auth: true, route: true }),
      false,
      true, // isEditing
    );

    expect(servingRuntime.metadata.annotations).toBeDefined();
    expect(servingRuntime.metadata.annotations?.['enable-auth']).toBe(undefined);
    expect(servingRuntime.metadata.annotations?.['enable-route']).toBe(undefined);
  });

  it('should add enable-xxxx annotations when creating', async () => {
    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: true,
        tokenAuth: true,
      }),
      'test',
      mockServingRuntimeTemplateK8sResource({}).objects[0] as ServingRuntimeKind,
      false,
      false, // isEditing
    );

    expect(servingRuntime.metadata.annotations).toBeDefined();
    expect(servingRuntime.metadata.annotations?.['enable-auth']).toBe('true');
    expect(servingRuntime.metadata.annotations?.['enable-route']).toBe('true');
  });

  it('should add enable-xxxx annotations when editing', async () => {
    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: true,
        tokenAuth: true,
      }),
      'test',
      mockServingRuntimeK8sResource({ auth: false, route: false }),
      false,
      true, // isEditing
    );

    expect(servingRuntime.metadata.annotations).toBeDefined();
    expect(servingRuntime.metadata.annotations?.['enable-auth']).toBe('true');
    expect(servingRuntime.metadata.annotations?.['enable-route']).toBe('true');
  });

  it('should add tolerations and gpu on modelmesh', async () => {
    const acceleratorProfileState: AcceleratorProfileState = {
      acceleratorProfile: mockAcceleratorProfile({}),
      acceleratorProfiles: [mockAcceleratorProfile({})],
      initialAcceleratorProfile: mockAcceleratorProfile({}),
      count: 1,
      additionalOptions: {},
      useExisting: false,
    };

    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: true,
        tokenAuth: true,
      }),
      'test',
      mockServingRuntimeK8sResource({ auth: false, route: false }),
      true,
      false,
      acceleratorProfileState,
      true,
    );

    expect(servingRuntime.spec.tolerations).toBeDefined();
    expect(servingRuntime.spec.containers[0].resources?.limits?.['nvidia.com/gpu']).toBe(1);
    expect(servingRuntime.spec.containers[0].resources?.requests?.['nvidia.com/gpu']).toBe(1);
  });

  it('should not add tolerations and gpu on kserve', async () => {
    const acceleratorProfileState: AcceleratorProfileState = {
      acceleratorProfile: mockAcceleratorProfile({}),
      acceleratorProfiles: [mockAcceleratorProfile({})],
      initialAcceleratorProfile: mockAcceleratorProfile({}),
      count: 1,
      additionalOptions: {},
      useExisting: false,
    };

    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: true,
        tokenAuth: true,
      }),
      'test',
      mockServingRuntimeK8sResource({ auth: false, route: false }),
      true,
      false,
      acceleratorProfileState,
      false,
    );

    expect(servingRuntime.spec.tolerations).toBeUndefined();
    expect(servingRuntime.spec.containers[0].resources?.limits?.['nvidia.com/gpu']).toBeUndefined();
    expect(
      servingRuntime.spec.containers[0].resources?.requests?.['nvidia.com/gpu'],
    ).toBeUndefined();
  });

  it('should have replica count on modelmesh', async () => {
    const replicaCount = 2;
    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: true,
        tokenAuth: true,
        numReplicas: replicaCount,
      }),
      'test',
      mockServingRuntimeK8sResource({ auth: false, route: false }),
      true,
      false,
      undefined,
      true,
    );

    expect(servingRuntime.spec.replicas).toBe(replicaCount);
  });

  it('should have replica count on modelmesh', async () => {
    const servingRuntime = assembleServingRuntime(
      mockServingRuntimeModalData({
        externalRoute: true,
        tokenAuth: true,
      }),
      'test',
      mockServingRuntimeK8sResource({ auth: false, route: false }),
      true,
      false,
      undefined,
      false,
    );

    expect(servingRuntime.spec.replicas).toBeUndefined();
  });
});
