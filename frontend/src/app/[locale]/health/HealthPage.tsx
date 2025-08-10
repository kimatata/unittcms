'use client';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableRow, TableHeader, TableCell, Chip, TableColumn } from '@heroui/react';
import { LocaleCodeType } from '@/types/locale';
import { HealthMessages } from '@/types/health';
import Config from '@/config/config';
import { logError } from '@/utils/errorHandler';
const apiServer = Config.apiServer;

type Props = {
  messages: HealthMessages;
  locale: LocaleCodeType;
};

async function fetchHealth() {
  const url = `${apiServer}/health`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error fetching health data:', error);
  }
}

export default function HealthPage({ messages, locale }: Props) {
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('loading...');
  const apiOrigin = Config.apiServer;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        setIsFetching(true);
        const data = await fetchHealth();
        setStatus(data.status);
        setIsFetching(false);
      } catch (error: unknown) {
        logError('Error in effect:', error);
      }
    }

    fetchDataEffect();
  }, [locale]);

  return (
    <>
      <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
        <div className="w-full p-3 flex items-center justify-between">
          <h3 className="font-bold">{messages.health_check}</h3>
        </div>

        <Table hideHeader aria-label="API server status">
          <TableHeader>
            <TableColumn>dummy</TableColumn>
            <TableColumn>dummy</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key="1">
              <TableCell>{messages.unittcms_version}</TableCell>
              <TableCell>1.0.0-beta.18</TableCell>
            </TableRow>
            <TableRow key="2">
              <TableCell>{messages.api_server}</TableCell>
              <TableCell>{apiOrigin}</TableCell>
            </TableRow>
            <TableRow key="3">
              <TableCell>{messages.status}</TableCell>
              <TableCell>
                {isFetching ? (
                  <Chip>Loading...</Chip>
                ) : (
                  <Chip color={status === 'ok' ? 'success' : 'danger'}>{status}</Chip>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}
