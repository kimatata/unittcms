import Config from "@/config/config";
const apiServer = Config.apiServer;

async function fetchCases(folderId: string) {
  const url = `${apiServer}/cases?folderId=${folderId}`;

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

async function createCase(folderId: string) {
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

async function deleteCase(caseId: number) {
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

async function deleteCases(deleteCases: string[]) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ caseIds: deleteCases }),
  };

  const url = `${apiServer}/cases/bulkdelete`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting cases:", error);
    throw error;
  }
}

export { fetchCases, createCase, deleteCase, deleteCases };
