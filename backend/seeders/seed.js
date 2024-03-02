"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add projects table records
    await queryInterface.bulkInsert("Projects", [
      {
        name: "Project 1",
        detail: "Details of Project 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Project 2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Project 3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add folders table records
    await queryInterface.bulkInsert("folders", [
      {
        name: "Folder 1",
        detail: "Details of Folder 1",
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Folder 2",
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Folder 3",
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add runs table records
    await queryInterface.bulkInsert("runs", [
      {
        name: "Run 1",
        projectId: 1,
        configurations: null,
        description: null,
        state: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Run 2",
        projectId: 1,
        configurations: null,
        description: null,
        state: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Run 3",
        projectId: 1,
        configurations: null,
        description: null,
        state: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add cases table records
    await queryInterface.bulkInsert("cases", [
      {
        title: "Sample Case 1",
        state: 1,
        priority: 1,
        type: 1,
        automationStatus: 1,
        description: "Sample description for case 1",
        template: 1,
        preConditions: "Sample pre-conditions for case 1",
        expectedResults: "Sample expected results for case 1",
        folderId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Sample Case 2",
        state: 1,
        priority: 1,
        type: 1,
        automationStatus: 1,
        description: "Sample description for case 2",
        template: 1,
        preConditions: "Sample pre-conditions for case 2",
        expectedResults: "Sample expected results for case 2",
        folderId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add steps table records
    await queryInterface.bulkInsert("steps", [
      {
        step: "Sample Step 1",
        result: "Sample Result 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: "Sample Step 2",
        result: "Sample Result 2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add case-step join table
    await queryInterface.bulkInsert("caseSteps", [
      {
        caseId: 1,
        stepId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        stepId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 2,
        stepId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // do nothingg
  },
};
