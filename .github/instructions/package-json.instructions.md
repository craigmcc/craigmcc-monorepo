---
applyTo: "{apps,packages}/*/package.json"
description: "Guidelines for maintaining package.json files in this monorepo."
---

# package.json Guidelines

## Introduction

The `package.json` file is the manifest for each package in this monorepo.
It defines the package's name, version, dependencies, scripts, and other metadata.
To ensure consistency and maintainability across our packages, please follow these
guidelines when creating or updating `package.json` files.

## Rules for Specific Fields

- For all packages, the `license` field should be set to `Apache-2.0`.
- For an app, the `name` field should be the same as the app's folder name (for example, `showcase`).
- For a package, the `name` field should be the same as the package's folder name prefixed with `@repo/` (for example, `@repo/ui`).
- For all packages, the `private` field should be set to `true` to prevent accidental publication to npm.
- For all packages, the `type` field should be set to `module` to enable ES module syntax.
- For an app, the `version` field should be set to `0.1.0` and should not be updated after that (since we do not publish apps).
- For a package, the `version` field should be set to `0.0.0` and left alone, since we are not publishing packages to npm and do not need to manage versions in the traditional way.

## Coding Rules

These rules apply to all of the `package.json` files in apps and packages, but not the top level package.json file.
- Sort all fields in alphabetical order based on the field name.
- For fields that have subfields (such as `dependencies`, `devDependencies`, `peerDependencies`, and `scripts`), sort the subfields in alphabetical order based on the subfield name.
- Required fields are `license`, `name`, `private`, `type`, and `version`.
- Optional fields (such as `dependencies` and `scripts`) should only be included if they have values.
- Use 2 spaces for indentation and no trailing commas, following standard JSON formatting rules.
