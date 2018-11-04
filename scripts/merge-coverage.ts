/**
 * Merge coverage reports.
 */

import * as coverageMerger from '@connectis/coverage-merger';
import * as glob from 'glob-promise';
import * as coverageToLcov from 'hitmap_json_to_lcov';
import * as _parseIcov from 'lcov-parse';

import { outputFile } from 'fs-extra';
import { promisify } from 'util';

const parseIcov = promisify(_parseIcov as (file: string, cb: (error: Error, data: ReadonlyArray<CoverageReportData>) => void) => void);

interface FileToReport {
  readonly [filename: string]: CoverageReportData;
}

interface ReportsByFile {
  readonly [filename: string]: ReadonlyArray<CoverageReportData>;
}

interface CoverageReportData {
  readonly title: string;
  readonly file: string;
  readonly functions: CoverageReportBlockData<{
    readonly name: string;
    readonly line: number;
    readonly hit: number;
  }>;
  readonly lines: CoverageReportBlockData<{
    readonly line: number;
    readonly hit: number;
  }>;
  readonly branches: CoverageReportBlockData<{
    readonly line: number;
    readonly block: number;
    readonly branch: number;
    readonly taken: number;
  }>;
}

interface CoverageReportBlockData<Detail> {
  readonly hit: number;
  readonly found: number;
  readonly details: ReadonlyArray<Detail>;
}

(async () => {
  const coverageReportFiles = await glob('coverage/*/lcov.info');

  const coverageReports = await Promise.all(
    coverageReportFiles.map(
      async (file) => parseIcov(file)
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
            (merged as object)[filename] === undefined
            ? []
            : merged[filename];

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
      return {
        ...merged,
        // tslint:disable-next-line:no-unsafe-any
        [reportsKey]: coverageMerger.merge(reportsByFile[reportsKey])
      };
    }, {});

  // tslint:disable-next-line:no-unsafe-any
  await outputFile('coverage/lcov.info', coverageToLcov(mergedReports));
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
