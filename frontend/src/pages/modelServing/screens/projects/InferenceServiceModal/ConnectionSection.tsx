import React from 'react';
import {
  Alert,
  Flex,
  FlexItem,
  FormGroup,
  FormSection,
  Label,
  Popover,
  Radio,
  Skeleton,
  Stack,
  StackItem,
  Truncate,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import {
  Connection,
  ConnectionTypeConfigMapObj,
  ConnectionTypeFieldType,
  ConnectionTypeValueType,
} from '~/concepts/connectionTypes/types';
import {
  getDescriptionFromK8sResource,
  getDisplayNameFromK8sResource,
  getResourceNameFromK8sResource,
} from '~/concepts/k8s/utils';
import ConnectionTypeForm from '~/concepts/connectionTypes/ConnectionTypeForm';
import { useK8sNameDescriptionFieldData } from '~/concepts/k8s/K8sNameDescriptionField/K8sNameDescriptionField';
import { isK8sNameDescriptionDataValid } from '~/concepts/k8s/K8sNameDescriptionField/utils';
import {
  assembleConnectionSecret,
  filterEnabledConnectionTypes,
  getConnectionTypeDisplayName,
  getConnectionTypeRef,
  getDefaultValues,
  isConnectionTypeDataField,
  isModelServingCompatible,
  ModelServingCompatibleTypes,
  S3ConnectionTypeKeys,
  withRequiredFields,
} from '~/concepts/connectionTypes/utils';
import { ConnectionDetailsHelperText } from '~/concepts/connectionTypes/ConnectionDetailsHelperText';
import { useWatchConnectionTypes } from '~/utilities/useWatchConnectionTypes';
import TypeaheadSelect, { TypeaheadSelectOption } from '~/components/TypeaheadSelect';
import {
  CreatingInferenceServiceObject,
  InferenceServiceStorageType,
  LabeledConnection,
} from '~/pages/modelServing/screens/types';
import { UpdateObjectAtPropAndValue } from '~/pages/projects/types';
import { isModelPathValid } from '~/pages/modelServing/screens/projects/utils';
import usePersistentData from '~/pages/projects/screens/detail/connections/usePersistentData';
import DashboardPopupIconButton from '~/concepts/dashboard/DashboardPopupIconButton';
import { AccessTypes } from '~/pages/projects/dataConnections/const';
import ConnectionS3FolderPathField from './ConnectionS3FolderPathField';
import ConnectionOciPathField from './ConnectionOciPathField';
import { ConnectionOciAlert } from './ConnectionOciAlert';

type ExistingConnectionFieldProps = {
  connectionTypes: ConnectionTypeConfigMapObj[];
  projectConnections: LabeledConnection[];
  selectedConnection?: Connection;
  onSelect: (connection: Connection) => void;
  folderPath: string;
  setFolderPath: (path: string) => void;
  modelUri?: string;
  setModelUri: (uri?: string) => void;
  setIsConnectionValid: (isValid: boolean) => void;
};

const ExistingConnectionField: React.FC<ExistingConnectionFieldProps> = ({
  connectionTypes,
  projectConnections,
  selectedConnection,
  onSelect,
  folderPath,
  setFolderPath,
  modelUri,
  setModelUri,
  setIsConnectionValid,
}) => {
  const options: TypeaheadSelectOption[] = React.useMemo(
    () =>
      projectConnections.map((connection) => {
        const { isRecommended } = connection;
        const displayName = getDisplayNameFromK8sResource(connection.connection);

        return {
          content: displayName,
          value: getResourceNameFromK8sResource(connection.connection),
          dropdownLabel: (
            <>
              {isRecommended && (
                <Label color="blue" isCompact>
                  Recommended
                </Label>
              )}
            </>
          ),
          description: (
            <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapNone' }}>
              {getDescriptionFromK8sResource(connection.connection) && (
                <FlexItem>
                  <Truncate content={getDescriptionFromK8sResource(connection.connection)} />
                </FlexItem>
              )}
              <FlexItem>
                <Truncate
                  content={`Type: ${
                    getConnectionTypeDisplayName(connection.connection, connectionTypes) ||
                    'Unknown'
                  }`}
                />
              </FlexItem>
            </Flex>
          ),
          isSelected:
            !!selectedConnection &&
            getResourceNameFromK8sResource(connection.connection) ===
              getResourceNameFromK8sResource(selectedConnection),
        };
      }),
    [connectionTypes, projectConnections, selectedConnection],
  );

  const selectedConnectionType = React.useMemo(
    () =>
      connectionTypes.find(
        (t) => getResourceNameFromK8sResource(t) === getConnectionTypeRef(selectedConnection),
      ),
    [connectionTypes, selectedConnection],
  );

  React.useEffect(() => {
    setIsConnectionValid(
      !!selectedConnection && isModelPathValid(selectedConnection, folderPath, modelUri),
    );
  }, [folderPath, modelUri, selectedConnection, setIsConnectionValid]);

  return (
    <>
      <FormGroup
        label="Connection"
        isRequired
        className="pf-v6-u-mb-lg"
        labelHelp={
          <Popover
            aria-label="Hoverable popover"
            bodyContent="This list includes only connections that are compatible with model serving."
          >
            <DashboardPopupIconButton
              icon={<OutlinedQuestionCircleIcon />}
              aria-label="More info"
            />
          </Popover>
        }
      >
        <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <TypeaheadSelect
              selectOptions={options}
              onSelect={(_, value) => {
                const newConnection = projectConnections.find(
                  (c) => getResourceNameFromK8sResource(c.connection) === value,
                );
                if (newConnection) {
                  onSelect(newConnection.connection);
                }
              }}
              popperProps={{ appendTo: 'inline' }}
              previewDescription={false}
            />
          </FlexItem>
          <FlexItem>
            <ConnectionDetailsHelperText
              connection={selectedConnection}
              connectionType={selectedConnectionType}
            />
          </FlexItem>
        </Flex>
        {selectedConnectionType &&
          isModelServingCompatible(selectedConnectionType, ModelServingCompatibleTypes.OCI) && (
            <ConnectionOciAlert />
          )}
      </FormGroup>
      {selectedConnection &&
        isModelServingCompatible(
          selectedConnection,
          ModelServingCompatibleTypes.S3ObjectStorage,
        ) && <ConnectionS3FolderPathField folderPath={folderPath} setFolderPath={setFolderPath} />}
      {selectedConnection &&
        isModelServingCompatible(selectedConnection, ModelServingCompatibleTypes.OCI) && (
          <ConnectionOciPathField
            ociHost={window.atob(selectedConnection.data?.OCI_HOST ?? '')}
            modelUri={modelUri}
            setModelUri={setModelUri}
          />
        )}
    </>
  );
};

type NewConnectionFieldProps = {
  connectionTypes: ConnectionTypeConfigMapObj[];
  data: CreatingInferenceServiceObject;
  setData: UpdateObjectAtPropAndValue<CreatingInferenceServiceObject>;
  initialNewConnectionType: ConnectionTypeConfigMapObj | undefined;
  initialNewConnectionValues: {
    [key: string]: ConnectionTypeValueType;
  };
  setNewConnection: (connection: Connection) => void;
  modelUri?: string;
  setModelUri: (uri?: string) => void;
  setIsConnectionValid: (isValid: boolean) => void;
};

const NewConnectionField: React.FC<NewConnectionFieldProps> = ({
  connectionTypes,
  data,
  setData,
  initialNewConnectionType,
  initialNewConnectionValues,
  setNewConnection,
  modelUri,
  setModelUri,
  setIsConnectionValid,
}) => {
  const enabledConnectionTypes = React.useMemo(
    () => filterEnabledConnectionTypes(connectionTypes),
    [connectionTypes],
  );
  const [selectedConnectionType, setSelectedConnectionType] = React.useState<
    ConnectionTypeConfigMapObj | undefined
  >(
    initialNewConnectionType ||
      (enabledConnectionTypes.length === 1
        ? withRequiredFields(connectionTypes[0], S3ConnectionTypeKeys)
        : undefined),
  );
  const { data: nameDescData, onDataChange: setNameDescData } = useK8sNameDescriptionFieldData();
  const [connectionValues, setConnectionValues] = React.useState<{
    [key: string]: ConnectionTypeValueType;
  }>(
    enabledConnectionTypes.length === 1
      ? getDefaultValues(enabledConnectionTypes[0])
      : initialNewConnectionValues,
  );

  React.useEffect(() => {
    if (initialNewConnectionType) {
      setSelectedConnectionType(initialNewConnectionType);
      setConnectionValues(initialNewConnectionValues);
    }
  }, [initialNewConnectionType, initialNewConnectionValues]);

  const [connectionErrors, setConnectionErrors] = React.useState<{
    [key: string]: boolean | string;
  }>({});
  const isFormValid = React.useMemo(
    () =>
      !!selectedConnectionType &&
      isK8sNameDescriptionDataValid(nameDescData) &&
      !selectedConnectionType.data?.fields?.find(
        (field) =>
          isConnectionTypeDataField(field) &&
          field.required &&
          !connectionValues[field.envVar] &&
          field.type !== ConnectionTypeFieldType.Boolean,
      ) &&
      !Object.values(connectionErrors).find((e) => !!e),
    [selectedConnectionType, nameDescData, connectionValues, connectionErrors],
  );

  React.useEffect(() => {
    let newConnection;
    if (selectedConnectionType) {
      newConnection = assembleConnectionSecret(
        data.project,
        getResourceNameFromK8sResource(selectedConnectionType),
        nameDescData,
        connectionValues,
      );
      setNewConnection(newConnection);
    }
    setIsConnectionValid(
      isFormValid &&
        !!newConnection &&
        isModelPathValid(newConnection, data.storage.path, modelUri),
    );
  }, [
    connectionValues,
    data.project,
    connectionErrors,
    data.storage.path,
    modelUri,
    isFormValid,
    nameDescData,
    selectedConnectionType,
    setIsConnectionValid,
    setNewConnection,
  ]);

  const { changeSelectionType } = usePersistentData({
    setConnectionValues,
    setConnectionErrors,
    setSelectedConnectionType,
    connectionValues,
    selectedConnectionType,
  });

  return (
    <FormSection>
      <ConnectionTypeForm
        options={enabledConnectionTypes}
        connectionType={selectedConnectionType}
        setConnectionType={(type) => {
          setSelectedConnectionType(
            withRequiredFields(
              connectionTypes.find((t) => getResourceNameFromK8sResource(t) === type),
              S3ConnectionTypeKeys,
            ),
          );
          const obj = connectionTypes.find((c) => c.metadata.name === type);
          changeSelectionType(obj);
        }}
        connectionNameDesc={nameDescData}
        setConnectionNameDesc={setNameDescData}
        connectionValues={connectionValues}
        onChange={(field, value) =>
          setConnectionValues((prev) => ({ ...prev, [field.envVar]: value }))
        }
        onValidate={(field, error, value) => {
          let newError = error;
          if (field.envVar === 'ACCESS_TYPE' && Array.isArray(value)) {
            if (value.includes(AccessTypes.PUSH) && !value.includes(AccessTypes.PULL)) {
              newError = 'Access type must include pull';
            }
          }
          setConnectionErrors((prev) => ({ ...prev, [field.envVar]: newError }));
        }}
        connectionErrors={connectionErrors}
        Alert={
          selectedConnectionType &&
          isModelServingCompatible(selectedConnectionType, ModelServingCompatibleTypes.OCI) ? (
            <ConnectionOciAlert />
          ) : undefined
        }
      />
      {selectedConnectionType &&
        isModelServingCompatible(
          selectedConnectionType,
          ModelServingCompatibleTypes.S3ObjectStorage,
        ) && (
          <ConnectionS3FolderPathField
            folderPath={data.storage.path}
            setFolderPath={(path) => setData('storage', { ...data.storage, path })}
          />
        )}
      {selectedConnectionType &&
        isModelServingCompatible(selectedConnectionType, ModelServingCompatibleTypes.OCI) &&
        (typeof connectionValues.OCI_HOST === 'string' ||
          typeof connectionValues.OCI_HOST === 'undefined') && (
          <ConnectionOciPathField
            ociHost={connectionValues.OCI_HOST}
            modelUri={modelUri}
            setModelUri={setModelUri}
            isNewConnection
          />
        )}
    </FormSection>
  );
};

type Props = {
  existingUriOption?: string;
  data: CreatingInferenceServiceObject;
  setData: UpdateObjectAtPropAndValue<CreatingInferenceServiceObject>;
  initialNewConnectionType: ConnectionTypeConfigMapObj | undefined;
  initialNewConnectionValues: {
    [key: string]: ConnectionTypeValueType;
  };
  connection: Connection | undefined;
  setConnection: (connection?: Connection) => void;
  setIsConnectionValid: (isValid: boolean) => void;
  loaded?: boolean;
  loadError?: Error | undefined;
  connections?: LabeledConnection[];
  connectionTypeFilter?: (ct: ConnectionTypeConfigMapObj) => boolean;
};

export const ConnectionSection: React.FC<Props> = ({
  existingUriOption,
  data,
  setData,
  initialNewConnectionType,
  initialNewConnectionValues,
  connection,
  setConnection,
  setIsConnectionValid,
  loaded,
  loadError,
  connections,
  connectionTypeFilter = () => true,
}) => {
  const [modelServingConnectionTypes] = useWatchConnectionTypes(true);
  const connectionTypes = React.useMemo(
    () => modelServingConnectionTypes.filter(connectionTypeFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelServingConnectionTypes],
  );

  const hasImagePullSecret = React.useMemo(() => !!data.imagePullSecrets, [data.imagePullSecrets]);

  const selectedConnection = React.useMemo(
    () =>
      connections?.find(
        (c) => getResourceNameFromK8sResource(c.connection) === data.storage.dataConnection,
      ),
    [connections, data.storage.dataConnection],
  );

  React.useEffect(() => {
    if (selectedConnection && !connection) {
      setConnection(selectedConnection.connection);
    }
  }, [selectedConnection, connection, setConnection]);

  if (loadError) {
    return (
      <Alert title="Error loading connections" variant="danger">
        {loadError.message}
      </Alert>
    );
  }

  if (!loaded) {
    return <Skeleton />;
  }

  return (
    <>
      {existingUriOption && !hasImagePullSecret && (
        <Radio
          id="existing-uri-radio"
          name="existing-uri-radio"
          data-testid="existing-uri-radio"
          label="Current URI"
          isChecked={data.storage.type === InferenceServiceStorageType.EXISTING_URI}
          onChange={() => {
            setConnection(undefined);
            setData('storage', {
              ...data.storage,
              type: InferenceServiceStorageType.EXISTING_URI,
              uri: existingUriOption,
              alert: undefined,
            });
          }}
          body={data.storage.type === InferenceServiceStorageType.EXISTING_URI && data.storage.uri}
        />
      )}
      <Radio
        name="existing-connection-radio"
        id="existing-connection-radio"
        data-testid="existing-connection-radio"
        label="Existing connection"
        isChecked={data.storage.type === InferenceServiceStorageType.EXISTING_STORAGE}
        onChange={() => {
          setConnection(undefined);
          setData('storage', {
            ...data.storage,
            type: InferenceServiceStorageType.EXISTING_STORAGE,
            uri: undefined,
            alert: undefined,
          });
        }}
        body={
          data.storage.type === InferenceServiceStorageType.EXISTING_STORAGE &&
          connections && (
            <ExistingConnectionField
              connectionTypes={connectionTypes}
              projectConnections={connections}
              selectedConnection={selectedConnection?.connection}
              onSelect={(selection) => {
                setConnection(selection);
                setData('storage', {
                  ...data.storage,
                  dataConnection: getResourceNameFromK8sResource(selection),
                });
              }}
              folderPath={data.storage.path}
              setFolderPath={(path) => setData('storage', { ...data.storage, path })}
              modelUri={data.storage.uri}
              setModelUri={(uri) => setData('storage', { ...data.storage, uri })}
              setIsConnectionValid={setIsConnectionValid}
            />
          )
        }
      />
      <Radio
        name="new-connection-radio"
        id="new-connection-radio"
        data-testid="new-connection-radio"
        label="Create connection"
        className="pf-v6-u-mb-lg"
        isChecked={data.storage.type === InferenceServiceStorageType.NEW_STORAGE}
        onChange={() => {
          setConnection(undefined);
          setData('storage', {
            ...data.storage,
            type: InferenceServiceStorageType.NEW_STORAGE,
            uri: undefined,
            alert: undefined,
          });
        }}
        body={
          data.storage.type === InferenceServiceStorageType.NEW_STORAGE && (
            <Stack hasGutter>
              {data.storage.alert && (
                <StackItem>
                  <Alert
                    isInline
                    variant={data.storage.alert.type}
                    title={data.storage.alert.title}
                  >
                    {data.storage.alert.message}
                  </Alert>
                </StackItem>
              )}
              <NewConnectionField
                connectionTypes={connectionTypes}
                data={data}
                setData={setData}
                initialNewConnectionType={initialNewConnectionType}
                initialNewConnectionValues={initialNewConnectionValues}
                setNewConnection={setConnection}
                modelUri={data.storage.uri}
                setModelUri={(uri) => setData('storage', { ...data.storage, uri })}
                setIsConnectionValid={setIsConnectionValid}
              />
            </Stack>
          )
        }
      />
    </>
  );
};
