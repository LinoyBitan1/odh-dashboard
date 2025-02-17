import { InferenceServiceKind, ProjectKind, PodKind } from '~/k8sTypes';
import { getDisplayNameFromK8sResource } from '~/concepts/k8s/utils';
import { InferenceServiceModelState, ModelStatus } from '~/pages/modelServing/screens/types';
import { asEnumMember } from '~/utilities/utils';
import { useAppContext } from '~/app/AppContext';
import { useIntegratedAppStatus } from '~/pages/exploreApplication/useIntegratedAppStatus';
import { NIMAvailabilityContext } from '~/concepts/nimServing/NIMAvailabilityContext';
import React from 'react';

export const getInferenceServiceModelState = (
  is: InferenceServiceKind,
): InferenceServiceModelState =>
  asEnumMember(is.status?.modelStatus?.states?.targetModelState, InferenceServiceModelState) ||
  asEnumMember(is.status?.modelStatus?.states?.activeModelState, InferenceServiceModelState) ||
  InferenceServiceModelState.UNKNOWN;

export const getInferenceServiceStatusMessage = (is: InferenceServiceKind): string => {
  const { isNIMAvailable } = React.useContext(NIMAvailabilityContext);
  if (!isNIMAvailable) {
    return 'NVIDIA NIM is disabled';
  }
  const activeModelState = is.status?.modelStatus?.states?.activeModelState;
  const targetModelState = is.status?.modelStatus?.states?.targetModelState;

  const stateMessage = (targetModelState || activeModelState) ?? 'Unknown';
  console.log('stateMessage', stateMessage);
  if (
    activeModelState === InferenceServiceModelState.FAILED_TO_LOAD ||
    targetModelState === InferenceServiceModelState.FAILED_TO_LOAD
  ) {
    const lastFailureMessage = is.status?.modelStatus?.lastFailureInfo?.message;
    console.log('lastFailureMessage', lastFailureMessage);
    return lastFailureMessage || stateMessage;
  }

  if (
    activeModelState === InferenceServiceModelState.LOADED &&
    (targetModelState === InferenceServiceModelState.LOADING ||
      targetModelState === InferenceServiceModelState.PENDING)
  ) {
    return 'Redeploying';
  }

  return stateMessage;
};

export const getInferenceServiceProjectDisplayName = (
  is: InferenceServiceKind,
  projects: ProjectKind[],
): string => {
  const project = projects.find(({ metadata: { name } }) => name === is.metadata.namespace);
  return project ? getDisplayNameFromK8sResource(project) : 'Unknown';
};

export const checkModelStatus = (model: PodKind): ModelStatus => {
  const modelStatus = !!model.status?.conditions.some(
    (currentModel) => currentModel.reason === 'Unschedulable',
  );
  return {
    failedToSchedule: model.status?.phase === 'Pending' && modelStatus,
  };
};
