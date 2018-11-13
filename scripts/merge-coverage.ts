/**
 * Merge coverage reports.
 */

import * as fs from 'fs';
import * as glob from 'glob-promise';
import { createReporter } from 'istanbul-api';
import { createCoverageMap } from 'istanbul-lib-coverage';
import * as yaml from 'js-yaml';

(async () => {
  const map = createCoverageMap();
  const reporter = createReporter();

  const coverageReportFiles = await glob('coverage-partial/*/coverage-final.json');
  const coverageReports = await Promise.all(
    coverageReportFiles.map(async (report) => import(`../${report}`))
  );

  const istanbulConfig = yaml.safeLoad(fs.readFileSync('.istanbul.yml', 'utf-8'));

  coverageReports.forEach((coverage) => {
    Object.keys(coverage)
      .forEach((filename) => {
        const relativeFilename = filename.substring(`${process.cwd()}/`.length);
        if (!istanbulConfig.instrumentation.excludes.includes(relativeFilename)) {
          map.addFileCoverage(coverage[filename]);
        }
      });
  });

  reporter.addAll(['lcov', 'text']);
  reporter.write(map);
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
