#!/usr/bin/env node

import { ExposeVerbs } from '@/common';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// ------------------------------------------------------------------------------------
const interfaceDeclarations: Array<string> = ['export {}'];
const interfaceNames: Array<string> = [];
const ipcMethods: Array<string> = [];
const ipcSenderMethods: Array<string> = [];
const ipcHandlerMethods: Array<string> = [];
const ipcSubscriberMethods: Array<string> = [];

// ------------------------------------------------------------------------------------
const processFile = (opts: { filePath: string; program: ts.Program }) => {
  const { filePath, program } = opts;
  console.info('[processFile] Processing... | File: %s', filePath);

  const typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    console.error('[processFile] sourceFile NOT FOUND | File: %s', filePath);
    return;
  }

  ts.forEachChild(sourceFile, node => {
    if (!ts.isClassDeclaration(node) || !node.name) {
      return;
    }

    const className = node.name.text;
    const interfaceName = `I${className}Methods`;
    interfaceNames.push(interfaceName);

    const methodSignatures: string[] = [];

    node.members.forEach(member => {
      if (
        !ts.isMethodDeclaration(member) ||
        !member.name ||
        !ts.canHaveDecorators(member)
      ) {
        return;
      }

      const methodName = (member.name as ts.Identifier).text;
      const ipcMethod = `${className}.${methodName}`;
      ipcMethods.push(ipcMethod);

      // ----------------------------------------
      const decorators = ts.getDecorators(member as ts.HasDecorators);
      const decoratorStrings = decorators?.map(
        d => ((d.expression as ts.CallExpression).expression as ts.Identifier).text,
      );
      if (decoratorStrings?.includes(ExposeVerbs.HANDLER)) {
        ipcHandlerMethods.push(ipcMethod);
      }

      if (decoratorStrings?.includes(ExposeVerbs.SUBSCRIBER)) {
        ipcSubscriberMethods.push(ipcMethod);
      }

      if (decoratorStrings?.includes(ExposeVerbs.SENDER)) {
        ipcSenderMethods.push(ipcMethod);
      }

      // ----------------------------------------
      const parameters = member.parameters
        .map(param => {
          const paramName = (param.name as ts.Identifier).text;
          const paramType = typeChecker.getTypeAtLocation(param);
          const typeString = typeChecker.typeToString(paramType);
          return `${paramName}: ${typeString}`;
        })
        .join(', ');

      const returnType = typeChecker.getReturnTypeOfSignature(
        typeChecker.getSignatureFromDeclaration(member)!,
      );

      const returnTypeString = typeChecker.typeToString(returnType);
      methodSignatures.push(`\t${methodName}: (${parameters}) => ${returnTypeString};`);
    });

    const interfaceDeclaration = `export interface ${interfaceName} {\n${methodSignatures.join('\n')}\n}`;
    interfaceDeclarations.push(interfaceDeclaration);
  });
};

// ------------------------------------------------------------------------------------
const main = () => {
  const t = new Date().getTime();
  console.info('[electron-infra] START | Generating routes/types...');

  // ------------------------------------------------------------------------------------
  // ts-node ./generate-types.ts ./src/controllers ./interface.d.ts
  const srcDir = path.resolve(process.argv[2]);
  const outputFile = path.resolve(process.argv[3]);
  console.info('[electron-infra] srcDir: %s', srcDir);
  console.info('[electron-infra] outputFile: %s', outputFile);
  console.info();

  const program = ts.createProgram([path.join(srcDir, 'index.ts')], {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
  });

  if (!path.isAbsolute(srcDir)) {
    console.error(
      '[electron-infra] srcDir: %s | Required srcDir must be absolute path!',
      srcDir,
    );
    process.exit(-1);
  }

  if (!path.isAbsolute(outputFile) || !outputFile.endsWith('d.ts')) {
    console.error(
      "[electron-infra] outputFile: %s | Required outputFile must be absolute path and name ends with '.d.ts'!",
      outputFile,
    );
    process.exit(-1);
  }

  const files = fs.readdirSync(srcDir);
  if (!files.length) {
    console.error('[electron-infra] srcDir: %s | No file to export!', srcDir);
    process.exit(-1);
  }

  files.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (!filePath.endsWith('.ts') || file === 'index.ts') {
      return;
    }

    processFile({ filePath, program });
  });

  interfaceDeclarations.push(
    `export type TControllerMethods =\n\t| ${interfaceNames.map(el => `keyof ${el}`).join('\n\t| ')}`,
    `export type TIpcMethods =\n\t | ${ipcMethods.map(el => `'${el}'`).join('\n\t| ')}`,
    ipcSenderMethods.length
      ? `export type TIpcSenderMethods =\n\t | ${ipcSenderMethods.map(el => `'${el}'`).join('\n\t| ')}`
      : '',
    ipcHandlerMethods.length
      ? `export type TIpcHandlerMethods =\n\t | ${ipcHandlerMethods.map(el => `'${el}'`).join('\n\t| ')}`
      : '',
    ipcSubscriberMethods.length
      ? `export type TIpcSubscriberMethods =\n\t | ${ipcSubscriberMethods.map(el => `'${el}'`).join('\n\t| ')}`
      : '',
  );

  fs.writeFileSync(outputFile, interfaceDeclarations.join('\n\n'), 'utf8');

  console.info();
  console.info('[electron-infra] Generated outputFile | outputFile: %s', outputFile);
  console.info(
    '[electron-infra] DONE | Generated routes/types | Tooks: %s(ms)',
    new Date().getTime() - t,
  );
};

main();
