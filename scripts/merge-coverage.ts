/**
 * Merge coverage reports.
 */

import * as coverageMerger from '@connectis/coverage-merger';
import * as glob from 'glob-promise';
import * as coverageToLcov from 'hitmap_json_to_lcov';
import * as _parseIcov from 'lcov-parse';

import { outputFile } from 'fs-extra';
import { promisify } from 'util';

const parseIcov = promisify<any, any>(_parseIcov);

interface FileToReport {
  readonly [filename: string]: CoverageReportData;
}

interface ReportsByFile {
  readonly [filename: string]: ReadonlyArray<CoverageReportData>;
}

type CoverageReports = ReadonlyArray<{
  readonly [key: string]: CoverageReportData;
}>;

type CoverageReportData = any;

(async () => {
  const coverageReportFiles = await glob('coverage/*/lcov.info');

  const coverageReports = await Promise.all(
    coverageReportFiles.map(
      async (file) => (parseIcov(file) as unknown) as CoverageReports
    )
  );

  const reportsByFile = coverageReports.reduce<ReportsByFile>(
    (byFile, coverageReport) => {
      const fileToReport = coverageReport.reduce<FileToReport>(
        (byFilename, fileReport) => {
          return {
            ...byFilename,
            [fileReport.file]: fileReport
          };
        },
        {}
      );

      return Object.keys(fileToReport)
        .reduce((merged, filename) => {
          const previousFileCoverages =
            merged[filename] === undefined ? [] : merged[filename];

          return {
            ...merged,
            [filename]: [...previousFileCoverages, fileToReport[filename]]
          };
        }, byFile);
    },
    {}
  );

  const mergedReports = Object.keys(reportsByFile)
    .reduce<FileToReport>((merged, reportsKey) => {
      const mergedReport = coverageMerger.merge(reportsByFile[reportsKey]);
      return {
        ...merged,
        [reportsKey]: mergedReport
      };
    }, {});

  await outputFile('coverage/lcov.info', coverageToLcov(mergedReports));
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
