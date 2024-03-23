"use client";
import { useEffect, useState } from "react";
import Config from "@/config/config";
const apiServer = Config.apiServer;
import TestCaseTable from "./test-case-table";

/**
 * fetch folder records
 *
 * @param {string} url - API endpoint url
 * @returns {Promise<Array>} - project record array
 * @throws {Error}
 */
async function fetchCases(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

async function fetchCreateCase(folderId: string) {
  const newCase = {
    title: "untitled case",
    state: 0,
    priority: 2,
    type: 0,
    automationStatus: 0,
    description: "",
    template: 0,
    preConditions: "",
    expectedResults: "",
    folderId: folderId,
  };

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newCase),
  };

  const url = `${apiServer}/cases`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating case:", error);
    throw error;
  }
}

async function fetchDeleteCase(caseId: number) {
  const fetchOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = `${apiServer}/cases/${caseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
}

export default function Page({
  params,
}: {
  params: { projectId: string; folderId: string };
}) {
  const [cases, setCases] = useState([]);
  const url = `${apiServer}/cases?folderId=${params.folderId}`;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchCases(url);
        setCases(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  const handleCreateCase = async (folderId: string) => {
    const newCase = await fetchCreateCase(folderId);
    const updateCases = [...cases];
    updateCases.push(newCase);
    setCases(updateCases);
  };

  const handleDeleteCase = async (caseId: number) => {
    await fetchDeleteCase(caseId);
    const data = await fetchCases(url);
    setCases(data);
  };

  return (
    <>
      <TestCaseTable
        projectId={params.folderId}
        cases={cases}
        onCreateCase={() => handleCreateCase(params.folderId)}
        onDeleteCase={handleDeleteCase}
      />
    </>
  );
}
