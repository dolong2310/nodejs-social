export interface EncodedVideoStreamFile {
  filepath: string; // Absolute path of the encoded file on disk
  key: string; // Path relative to the encoding output root, using "/" separators (e.g. "<idName>/v0/fileSequence0.ts")
}

export interface EncodedVideoStream {
  outputDir: string;
  files: EncodedVideoStreamFile[];
}

export interface VideoStreamEncoderPort {
  // Encode the source video into HLS renditions.
  encode(filepath: string): Promise<void>;
  // List the HLS output (master playlist, rendition playlists and segments) of an encoded video.
  listEncodedFiles(idName: string): Promise<EncodedVideoStream>;
}
