const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withAndroidUploadSigning(config) {
  return withAppBuildGradle(config, (result) => {
    if (result.modResults.language !== 'groovy') throw new Error('Expected Expo Groovy build file');
    let source = result.modResults.contents;
    if (source.includes('// memorize-all upload signing')) return result;
    const releaseSigning =
      /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!releaseSigning.test(source) || !source.includes('    signingConfigs {'))
      throw new Error('Expo release signing template changed; inspect it before building');
    source = source.replace(releaseSigning, '$1signingConfig signingConfigs.upload');
    source = source.replace(
      '    signingConfigs {',
      `
    // memorize-all upload signing: credentials remain outside the project and app config.
    def uploadSigningPath = System.getenv("MEMORIZE_ALL_ANDROID_SIGNING_FILE")
    def uploadSigning = uploadSigningPath ? new groovy.json.JsonSlurper().parse(new File(uploadSigningPath)) : null
    if (gradle.startParameter.taskNames.any { it.toLowerCase().contains("release") } && !uploadSigning) {
        throw new GradleException("Set MEMORIZE_ALL_ANDROID_SIGNING_FILE to the registered upload signing file")
    }
    signingConfigs {
        upload {
            if (uploadSigning) {
                ["storeFile", "storePassword", "keyAlias", "keyPassword"].each { field ->
                    if (!uploadSigning[field]) throw new GradleException("Upload signing field is missing: " + field)
                }
                storeFile file(uploadSigning.storeFile)
                storePassword uploadSigning.storePassword
                keyAlias uploadSigning.keyAlias
                keyPassword uploadSigning.keyPassword
            }
        }`,
    );
    result.modResults.contents = source;
    return result;
  });
};
