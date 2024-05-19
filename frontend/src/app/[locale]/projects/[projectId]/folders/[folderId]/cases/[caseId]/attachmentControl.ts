import Config from '@/config/config';
const apiServer = Config.apiServer;

async function fetchDownloadAttachment(attachmentId: number, downloadFileName: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const url = `${apiServer}/attachments/download/${attachmentId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

async function fetchCreateAttachments(caseId: number, files: File[]) {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const url = `${apiServer}/attachments?parentCaseId=${caseId}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error: any) {
    console.error('Error uploading files:', error);
  }
}

async function fetchDeleteAttachment(attachmentId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const url = `${apiServer}/attachments/${attachmentId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export { fetchDownloadAttachment, fetchCreateAttachments, fetchDeleteAttachment };
