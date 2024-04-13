import Config from "@/config/config";
const apiServer = Config.apiServer;

async function fetchCreateStep(newStepNo: number, parentCaseId: number) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = `${apiServer}/steps?newStepNo=${newStepNo}&parentCaseId=${parentCaseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

async function fetchDeleteStep(stepId: number, parentCaseId: number) {
  const fetchOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = `${apiServer}/steps/${stepId}?parentCaseId=${parentCaseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

export {
  fetchCreateStep,
  fetchDeleteStep,
};
