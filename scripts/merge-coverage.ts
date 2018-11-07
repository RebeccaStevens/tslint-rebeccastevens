/**
 * Merge coverage reports.
 */

import * as glob from 'glob-promise';
import { createReporter } from 'istanbul-api';
import { createCoverageMap } from 'istanbul-lib-coverage';

(async () => {
  const map = createCoverageMap();
  const reporter = createReporter();

  const coverageReportFiles = await glob('coverage-partial/*/coverage-final.json');
  const coverageReports = await Promise.all(
    coverageReportFiles.map(async (report) => import(`../${report}`))
  );

  coverageReports.forEach((coverage) => {
    Object.keys(coverage)
      .forEach((filename) => {
        map.addFileCoverage(coverage[filename]);
      });
  });

  reporter.addAll(['lcov', 'text']);
  reporter.write(map);
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
