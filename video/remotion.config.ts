import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Comic outlines + flat fills compress well; crf 18 keeps text crisp.
Config.setCodec("h264");
Config.setCrf(18);
