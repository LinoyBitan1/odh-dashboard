import * as React from 'react';
import {
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { usePipelinesAPI } from '~/concepts/pipelines/context';
import { usePipelineVersionImportModalData } from '~/concepts/pipelines/content/import/useImportModalData';
import { getProjectDisplayName } from '~/pages/projects/utils';
import PipelineFileUpload from '~/concepts/pipelines/content/import/PipelineFileUpload';
import { PipelineKFv2, PipelineVersionKFv2 } from '~/concepts/pipelines/kfTypes';
import PipelineSelector from '~/concepts/pipelines/content/pipelineSelector/PipelineSelector';
import { generatePipelineVersionName } from './utils';

type PipelineVersionImportModalProps = {
  existingPipeline?: PipelineKFv2 | null;
  onClose: (pipelineVersion?: PipelineVersionKFv2, pipeline?: PipelineKFv2 | null) => void;
};

const PipelineVersionImportModal: React.FC<PipelineVersionImportModalProps> = ({
  existingPipeline,
  onClose,
}) => {
  const { project, api, apiAvailable } = usePipelinesAPI();
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const [{ name, description, pipeline, fileContents }, setData, resetData] =
    usePipelineVersionImportModalData(existingPipeline);

  const pipelineId = pipeline?.pipeline_id || '';
  const pipelineName = pipeline?.display_name || '';

  const isImportButtonDisabled = !apiAvailable || importing || !name || !fileContents || !pipeline;

  const onBeforeClose = (
    pipelineVersion?: PipelineVersionKFv2,
    currentPipeline?: PipelineKFv2 | null,
  ) => {
    onClose(pipelineVersion, currentPipeline);
    setImporting(false);
    setError(undefined);
    resetData();
  };

  return (
    <Modal
      title="Upload new version"
      isOpen
      onClose={() => onBeforeClose()}
      actions={[
        <Button
          key="import-button"
          variant="primary"
          isDisabled={isImportButtonDisabled}
          isLoading={importing}
          onClick={() => {
            setImporting(true);
            setError(undefined);
            api
              .uploadPipelineVersion({}, name, description, fileContents, pipelineId)
              .then((pipelineVersion) => onBeforeClose(pipelineVersion, pipeline))
              .catch((e) => {
                setImporting(false);
                setError(e);
              });
          }}
          data-testid="upload-version-submit-button"
        >
          Upload
        </Button>,
        <Button key="cancel-button" variant="secondary" onClick={() => onBeforeClose()}>
          Cancel
        </Button>,
      ]}
      variant="medium"
      data-testid="upload-version-modal"
    >
      <Form>
        <Stack hasGutter>
          <StackItem>
            <FormGroup label="Project">{getProjectDisplayName(project)}</FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label="Pipeline" isRequired fieldId="pipeline-selection">
              <PipelineSelector
                selection={pipelineName}
                onSelect={(newPipeline) => {
                  setData('pipeline', newPipeline);
                  setData('name', generatePipelineVersionName(newPipeline));
                }}
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label="Pipeline version name" isRequired fieldId="pipeline-version-name">
              <TextInput
                isRequired
                type="text"
                id="pipeline-version-name"
                name="pipeline-version-name"
                value={name}
                onChange={(e, value) => setData('name', value)}
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label="Pipeline version description" fieldId="pipeline-version-description">
              <TextInput
                isRequired
                type="text"
                id="pipeline-version-description"
                name="pipeline-version-description"
                value={description}
                onChange={(e, value) => setData('description', value)}
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <PipelineFileUpload
              fileContents={fileContents}
              onUpload={(data) => setData('fileContents', data)}
            />
          </StackItem>
          {error && (
            <StackItem>
              <Alert title="Error uploading pipeline version" isInline variant="danger">
                {error.message}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </Form>
    </Modal>
  );
};

export default PipelineVersionImportModal;
