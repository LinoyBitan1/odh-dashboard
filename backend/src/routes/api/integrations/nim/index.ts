import { FastifyReply, FastifyRequest } from 'fastify';
import { secureAdminRoute } from '../../../../utils/route-security';
import { KubeFastifyInstance, VariablesValidationStatus } from '../../../../types';
import { isString } from 'lodash';
import {
  apiKeyValidationStatus,
  apiKeyValidationTimestamp,
  createNIMAccount,
  deleteNIMAccount,
  errorMsgList,
  getNIMAccount,
  isAppEnabled,
  manageNIMSecret,
  getNIMSecret
} from './nimUtils';

module.exports = async (fastify: KubeFastifyInstance) => {
  const PAGE_NOT_FOUND_MESSAGE = '404 page not found';

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    await getNIMAccount(fastify)
      .then(async (response) => {
        if (response) {
          // Installed
          const isEnabled = isAppEnabled(response);
          const keyValidationStatus: string = apiKeyValidationStatus(response);
          const keyValidationTimestamp: string = apiKeyValidationTimestamp(response);
          const errorMsg: string = errorMsgList(response)[0];
          // const apiKey : string | null = (await getNIMSecret(fastify)) || null;
          reply.send({
            isInstalled: true,
            isEnabled: isEnabled,
            variablesValidationStatus: keyValidationStatus,
            variablesValidationTimestamp: keyValidationTimestamp,
            canInstall: !isEnabled,
            error: errorMsg,
            // apiKey:apiKey
          });
        } else {
          // Not installed
          fastify.log.info(`NIM account does not exist`);
          reply.send({
            isInstalled: false,
            isEnabled: false,
            variablesValidationStatus: VariablesValidationStatus.UNKNOWN,
            variablesValidationTimestamp: '',
            canInstall: true,
            error: '',
            // apiKey:null
          });
        }
      })
      .catch((e) => {
        if (e.response?.statusCode === 404) {
          // 404 error means the Account CRD does not exist, so cannot create CR based on it.
          if (
            isString(e.response.body) &&
            e.response.body.trim() === PAGE_NOT_FOUND_MESSAGE.trim()
          ) {
            fastify.log.info(`NIM not installed, ${e.response?.body}`);
            reply.send({
              isInstalled: false,
              isEnabled: false,
              variablesValidationStatus: VariablesValidationStatus.UNKNOWN,
              variablesValidationTimestamp: '',
              canInstall: false,
              error: 'NIM not installed',
              apiKey: null
            });
          }
        } else {
          fastify.log.error(`An unexpected error occurred: ${e.response.body?.message}`);
          reply.send({
            isInstalled: false,
            isEnabled: false,
            variablesValidationStatus: VariablesValidationStatus.UNKNOWN,
            variablesValidationTimestamp: '',
            canInstall: false,
            error: 'An unexpected error occurred. Please try again later.',
          });
        }
      });
  });

  fastify.post(
    '/',
    secureAdminRoute(fastify)(
      async (
        request: FastifyRequest<{
          Body: { [key: string]: string };
        }>,
        reply: FastifyReply,
      ) => {
        const enableValues = request.body;

        try {
          const prevEnableValues = await getNIMSecret(fastify)

          await manageNIMSecret(fastify, enableValues);
          // Ensure the account exists
          try {
            const account = await getNIMAccount(fastify);
            const nimAccount = !account ? await createNIMAccount(fastify) : account;
            const isEnabled = isAppEnabled(nimAccount);
            const keyValidationStatus: string = apiKeyValidationStatus(nimAccount);
            const keyValidationTimeStamp: string = apiKeyValidationTimestamp(nimAccount);
            reply.send({
              isInstalled: true,
              isEnabled: isEnabled,
              variablesValidationStatus: keyValidationStatus,
              variablesValidationTimestamp: keyValidationTimeStamp,
              canInstall: !isEnabled,
              error: '',
              prevEnableValues: prevEnableValues,
            });
          } catch (accountError: any) {
            const message = `Failed to create or retrieve NIM account: ${accountError.response?.body?.message}`;
            fastify.log.error(message);
            reply.status(accountError.response?.statusCode || 500).send(new Error(message));
          }
        } catch (secretError: any) {
          const message = `Failed to create NIM secret. ${secretError.response?.body?.message}`;
          fastify.log.error(message);
          reply.status(secretError.response?.statusCode || 500).send(new Error(message));
        }
      },
    ),
  );

  fastify.delete(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      deleteNIMAccount(fastify)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );
};
