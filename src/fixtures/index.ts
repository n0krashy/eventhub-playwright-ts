import { mergeTests } from '@playwright/test';
import { test as dataTest } from './dataFixtures';
import { test as pageTest } from './pageFixtures';

export const test = mergeTests(dataTest, pageTest);
export { expect } from '@playwright/test';
