import * as React from 'react';
import { PipelineCoreResourceKF, PipelineRunJobKF } from '~/concepts/pipelines/kfTypes';
import { getJobResourceRef } from '~/concepts/pipelines/content/tables/utils';
import { PipelineAPIState } from '~/concepts/pipelines/context/usePipelineAPIState';

type JobStatus = {
  loading: boolean;
  data: PipelineRunJobKF | null;
};

export type GetJobInformation = (resource?: PipelineCoreResourceKF) => JobStatus;

const useJobRelatedInformation = (
  apiState: PipelineAPIState,
): { getJobInformation: GetJobInformation } => {
  const [jobStorage, setJobStorage] = React.useState<{ [jobId: string]: JobStatus } | undefined>(
    {},
  );
  const loadedIds = React.useRef<string[]>([]);

  return {
    getJobInformation: React.useCallback<GetJobInformation>(
      (resource) => {
        if (!apiState.apiAvailable) {
          return { loading: false, data: null };
        }
        const jobReference = getJobResourceRef(resource);
        if (!jobReference) {
          return { loading: false, data: null };
        }
        const jobId = jobReference.key.id;
        if (jobStorage?.[jobId]) {
          return jobStorage[jobId];
        }
        if (loadedIds.current.includes(jobId)) {
          return { loading: true, data: null };
        }
        loadedIds.current.push(jobId);

        apiState.api
          .getPipelineRunJob({}, jobId)
          .then((job) => {
            setJobStorage((jobState) => ({ ...jobState, [jobId]: { loading: false, data: job } }));
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Could not fetch job reference', e);
            loadedIds.current = loadedIds.current.filter((i) => i !== jobId);
            return null;
          });

        return { loading: true, data: null };
      },
      [apiState, jobStorage],
    ),
  };
};

export default useJobRelatedInformation;
