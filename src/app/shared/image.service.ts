import { inject, Injectable } from "@angular/core";
import { Storage, getDownloadURL, ref, uploadBytesResumable } from '@angular/fire/storage';

@Injectable({
  providedIn: "root",
})
export class ImageService {
  public storage = inject(Storage);


  uploadFile(input: HTMLInputElement): Promise<string> {
    if (!this.hasValidFile(input)) return Promise.resolve('');
    const file = input.files![0];
    return this.uploadToStorage(file);
  }


  private hasValidFile(input: HTMLInputElement): boolean {
    return !!(input.files && input.files.length > 0);
  }


  private uploadToStorage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(this.storage, file.name);
      const uploadTask = uploadBytesResumable(storageRef, file);
      this.monitorUpload(uploadTask, resolve, reject);
    });
  }


  private monitorUpload(
    uploadTask: ReturnType<typeof uploadBytesResumable>,
    resolve: (url: string) => void,
    reject: (error: any) => void
  ) {
    uploadTask.on(
      'state_changed',
      null,
      (error) => reject(error),
      () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
    );
  }
}