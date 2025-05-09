import { Modal } from '~/__tests__/cypress/cypress/pages/components/Modal';

class ModelVersionDeployModal extends Modal {
  constructor() {
    super('Deploy model');
  }

  findProjectSelector() {
    return this.find().findByTestId('deploy-model-project-selector');
  }

  selectProjectByName(name: string) {
    this.findProjectSelector().click();
    cy.findByRole('option', { name, hidden: true }).click();
  }
}

export const modelVersionDeployModal = new ModelVersionDeployModal();
