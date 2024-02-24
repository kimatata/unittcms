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

  return (
    <>
      {/* <Listbox aria-label="Listbox Variants">
        {cases.map((testCase, index) => (
          <ListboxItem
            key={index}
            onClick={() =>
              router.push(
                `/projects/${params.projectId}/folders/${params.folderId}/cases/${testCase.id}`
              )
            }
          >
            {testCase.title}
          </ListboxItem>
        ))}
      </Listbox> */}
      <TestCaseTable projectId={params.folderId} cases={cases}/>
    </>
  );
}
