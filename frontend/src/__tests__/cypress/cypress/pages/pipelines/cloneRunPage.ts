import {
  ExperimentKFv2,
  PipelineKFv2,
  PipelineRunJobKFv2,
  PipelineRunKFv2,
  PipelineVersionKFv2,
} from '~/concepts/pipelines/kfTypes';
import { CreateRunPage } from '~/__tests__/cypress/cypress/pages/pipelines/createRunPage';

class CloneRunPage extends CreateRunPage {
  protected testId = 'clone-run-page';

  constructor(type: 'run' | 'schedule') {
    super(type);
  }

  mockGetRun(run: PipelineRunKFv2) {
    return cy.intercept(
      {
        method: 'POST',
        pathname: `/api/proxy/apis/v2beta1/runs/${run.run_id}`,
      },
      run,
    );
  }

  mockGetRecurringRun(recurringRun: PipelineRunJobKFv2) {
    return cy.intercept(
      {
        method: 'POST',
        pathname: `/api/proxy/apis/v2beta1/recurringruns/${recurringRun.recurring_run_id}`,
      },
      recurringRun,
    );
  }

  mockGetPipelineVersion(pipelineVersion: PipelineVersionKFv2): Cypress.Chainable<null> {
    return cy.intercept(
      {
        method: 'POST',
        pathname: `/api/proxy/apis/v2beta1/pipelines/${pipelineVersion.pipeline_id}/versions/${pipelineVersion.pipeline_version_id}`,
      },
      pipelineVersion,
    );
  }

  mockGetPipeline(pipeline: PipelineKFv2): Cypress.Chainable<null> {
    return cy.intercept(
      {
        method: 'POST',
        pathname: `/api/proxy/apis/v2beta1/pipelines/${pipeline.pipeline_id}`,
      },
      pipeline,
    );
  }

  mockGetExperiment(experiment: ExperimentKFv2): Cypress.Chainable<null> {
    return cy.intercept(
      {
        method: 'POST',
        pathname: `/api/proxy/apis/v2beta1/experiments/${experiment.experiment_id}`,
      },
      experiment,
    );
  }
}

export const cloneRunPage = new CloneRunPage('run');
export const cloneSchedulePage = new CloneRunPage('schedule');
