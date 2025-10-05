const eventBus = new EventTarget();
const TEST_CASE_MOVE = 'testCasesMove';

type MoveEventDetail = {
  testCaseIds: number[];
  targetFolderId: number;
};

export const emitMoveEvent = (ids: number[], targetFolderId: number) => {
  eventBus.dispatchEvent(
    new CustomEvent(TEST_CASE_MOVE, { detail: { testCaseIds: ids, targetFolderId: targetFolderId } })
  );
};

export const onMoveEvent = (listener: (event: CustomEvent<MoveEventDetail>) => void) => {
  const handler = (e: Event) => listener(e as CustomEvent);
  eventBus.addEventListener(TEST_CASE_MOVE, handler);
  return () => eventBus.removeEventListener(TEST_CASE_MOVE, handler);
};
