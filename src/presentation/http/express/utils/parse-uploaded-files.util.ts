import { Request } from 'express';
import formidable, { File } from 'formidable';

function normalizeFiles(value: File | File[] | undefined): File[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export async function parseUploadedFiles(
  req: Request,
  fieldName: string
): Promise<
  {
    filepath: string;
    filename: string;
    mimetype: string;
  }[]
> {
  const form = formidable({ multiples: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, _, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(
        normalizeFiles(files[fieldName] as File | File[] | undefined).map((file: File) => ({
          filepath: file.filepath,
          filename: file.newFilename,
          mimetype: file.mimetype ?? 'application/octet-stream'
        }))
      );
    });
  });
}
