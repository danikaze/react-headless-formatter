#!/usr/bin/env bash

##
# Retrieve a field value from a json file:
#  getJsonField "filename.json" "fieldName"
##
getJsonField() {
  local filename=$1
  local field=$2

  local value=$(cat "$filename" \
    | grep "\"$field\"" \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",]//g' \
    | tr -d '[[:space:]]')

  echo "$value"
}

##
# Stops the execution of the build with an error code and error message
##
error() {
  local errorCode=$1
  local errorMsg=$2
  echo -e " ${C_RED}(!)${C_DEFAULT} Build stopped because of an error while ${C_YELLOW}${errorMsg}${C_DEFAULT}"
  exit $errorCode
}

##
# Define constants
##
C_YELLOW='\033[1;33m'
C_RED='\033[1;31m'
C_DEFAULT='\033[0m'
PWD=`pwd`
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"/..
TARGET_DIR="${PROJECT_ROOT}/dist"
TSC="${PROJECT_ROOT}/node_modules/.bin/tsc --project tsconfig.build.json"
TSPM="${PROJECT_ROOT}/node_modules/.bin/ef-tspm -s -c tsconfig.build.json"
PACKAGE_JSON="${PROJECT_ROOT}/package.json"
PACKAGE_NAME=$(getJsonField "${PACKAGE_JSON}" name)
PACKAGE_VERSION=$(getJsonField "${PACKAGE_JSON}" version)
BUILD_ONLY=0

##
# Read arguments
##
while test $# -gt 0
do
  case "$1" in
    --only) BUILD_ONLY=1
      ;;
    *) error 1 "unknown argument $1"
      ;;
  esac
  shift
done

# Execute the tests
if [ $BUILD_ONLY -ne 1 ]; then
  echo -e "* Running the tests..."
  npm run test || error 2 "running the tests"
fi

# Generate built files in the `dist` folder
echo -e "* Building ${C_YELLOW}${PACKAGE_NAME}-${PACKAGE_VERSION}${C_DEFAULT}..."
$TSC || error 3 "executing tsc"

# Copy package.json without the "security" private field
echo -e "* Copying ${C_YELLOW}package.json${C_DEFAULT} for publishing npm..."
cat "${PACKAGE_JSON}" | grep -v "private" > "${TARGET_DIR}/package.json" || error 3 "copying package.json"

# Copy other files to include in the npm
echo -e "* Copying ${C_YELLOW}README.md${C_DEFAULT} to be included within the npm..."
cp "${PROJECT_ROOT}/README.md" "${TARGET_DIR}/README.md" || error 4 "copying README.md"

# Revert the typescript aliases in the generated code
echo -e "* De-mapping typescript aliases..."
$TSPM 2> /dev/null # tspm fails if it founds no aliases used

# Ask to publish the npm
if [ $BUILD_ONLY -ne 1 ]; then
  echo
  read -p "Publish npm? [y/N] " -n1 ans
  echo
  if [[ $ans =~ [yY] ]]; then
    echo -e "* Publishing ${C_YELLOW}${PACKAGE_NAME}-${PACKAGE_VERSION}${C_DEFAULT}..."
    cd "${TARGET_DIR}"
    npm publish
  fi
fi

echo
cd "${PWD}"
