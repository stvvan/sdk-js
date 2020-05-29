// @flow
const webpack = require('webpack');

const plugin = new webpack.EnvironmentPlugin([
  'CI',

  'TANKER_ID_TOKEN',
  'TANKER_ADMIND_URL',
  'TANKER_FAKE_AUTH_URL',
  'TANKER_TRUSTCHAIND_URL',

  'TANKER_OIDC_CLIENT_SECRET',
  'TANKER_OIDC_CLIENT_ID',
  'TANKER_OIDC_PROVIDER',
  'TANKER_OIDC_KEVIN_EMAIL',
  'TANKER_OIDC_KEVIN_REFRESH_TOKEN',
  'TANKER_OIDC_MARTINE_EMAIL',
  'TANKER_OIDC_MARTINE_REFRESH_TOKEN',

  'TANKER_FILEKIT_BUCKET_NAME',
  'TANKER_FILEKIT_BUCKET_REGION',
  'TANKER_FILEKIT_CLIENT_ID',
  'TANKER_FILEKIT_CLIENT_SECRET',
]);

module.exports = { plugin };