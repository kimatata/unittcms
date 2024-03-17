"use strict";
const path = require("path");
const fs = require("fs");

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
      {
        step: "Sample Step 3",
        result: "Sample Result 3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: "Sample Step 4",
        result: "Sample Result 4",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add case-step join table
    await queryInterface.bulkInsert("caseSteps", [
      {
        caseId: 1,
        stepId: 1,
        stepNo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        stepId: 2,
        stepNo: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        stepId: 3,
        stepNo: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        stepId: 4,
        stepNo: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 2,
        stepId: 2,
        stepNo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("attachments", [
      {
        title: "Selenium logo",
        detail: "",
        path: "http://localhost:3001/uploads/861px-Selenium_Logo.png",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "vitest logo",
        detail: "",
        path: "http://localhost:3001/uploads/logo-shadow.svg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // copy sample files to uploads folder
    const sampleFolderPath = "public/sample";
    const uploadsFolderPath = "public/uploads";
    const SeleniumLogoFileName = "861px-Selenium_Logo.png";
    const vitestLogoFileName = "logo-shadow.svg";
    if (!fs.existsSync(uploadsFolderPath)) {
      fs.mkdirSync(uploadsFolderPath, { recursive: true });
    }
    fs.copyFile(
      `${sampleFolderPath}/${SeleniumLogoFileName}`,
      `${uploadsFolderPath}/${SeleniumLogoFileName}`,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
    fs.copyFile(
      `${sampleFolderPath}/${vitestLogoFileName}`,
      `${uploadsFolderPath}/${vitestLogoFileName}`,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );

    await queryInterface.bulkInsert("caseAttachments", [
      {
        caseId: 1,
        attachmentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        attachmentId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // do nothingg
  },
};
