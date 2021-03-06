/// <reference path="../../../typings/angularjs/angular.d.ts"/>
/// <reference path="../../../bower_components/ngDrive/ngdrive_ts_declaration_files/drive_interfaces.d.ts"/>

class MaximalCtrl1 {
  sig = 'MaximalCtrl';

  // an array of steps to display
  steps: Array<any> = [];

  email = "";

  // a current file (the last inserted) that most functions will operate on
  currentFile: ngDrive.IDriveFile;
  currentFolder: ngDrive.IDriveFile;
  currentPermission: ngDrive.IDrivePermission;
  currentRevision: ngDrive.IDriveRevision;
  largestChangeId = 0;
  currentStepImage = '';

  fileButton:any;           // model of input type=file button

  static $inject = ['$scope', '$log', '$q', 'DriveService'];

  constructor(private $scope, private $log: ng.ILogService, private $q: ng.IQService, private DriveService: ngDrive.IDriveService) {
    $scope.vm = this;

    window['DS'] = this.DriveService;
    console.info("A reference to the DriveService has been placed at window.DS\nYou can use this to manually run commands, eg. DS.files.list({maxResults:1, fields:\"items\"})");
    this.doEverything();
  }

  /**
   * well actually any binary data type will work, but image is the most commoni requirement.
   * called by the onchange event of the input type-file button
   * @param  {[type]} element [description]
   * @return {[type]}         [description]
   */
  uploadImage(element) {
    var files = element.files;
    console.log(files[0].name + ' ' + files[0].type)
    var reader = new FileReader()
    reader.onload = () => {
      var content = reader.result;
      this.currentStepImage = 'Inserting ' + content.length ;
      var def = this.$q.defer();
      this.DriveService.files.insertWithContent({
        title: files[0].name,
        mimeType: files[0].type
      }, { uploadType: 'resumable' }, content, undefined).promise.then(
        // success
        (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
          this.currentStepImage = resp.data.id + ' , content length = ' + resp.data.fileSize;
          this.currentFile = resp.data;
        },
        // failure
        (reason) => { def.reject(reason) },
        // progress
        (position) => {
          console.log('notification at position ' + position);
          this.currentStepImage = 'progress = ' + position;
        });
        this.$scope.$apply()
    }
    reader.readAsBinaryString(element.files[0])

  }

	/**
	 * perform all steps using promise chaining to run them in sequence
	 */
  doEverything() {
    // this.resumable('resumable');
    this.getAbout()
      .then(() => {
      return this.insertFiles('delmezzz', 2)
    })
      .then(() => {
      return this.getFile(this.currentFile.id)
    })
      .then(() => {
      return this.getFileContents(this.currentFile.id)
    })
      .then(() => {
      return this.patchFileTitle(this.currentFile.id, this.currentFile.title + " PATCHED")
    })
      .then(() => {
      return this.updateFileTitle(this.currentFile.id, this.currentFile.title + " UPDATED")
    })
      .then(() => {
      return this.updateFileContent(this.currentFile.id, 'updated file content')
    })
      .then(() => {
      return this.touchFile(this.currentFile.id)
    })
      .then(() => {
      return this.trashFile(this.currentFile.id)
    })
      .then(() => {
      return this.untrashFile(this.currentFile.id)
    })
      .then(() => {
      return this.listChanges(this.largestChangeId);
    })
      .then(() => {
      return this.getChange(this.largestChangeId);
    })
      .then(() => {
      return this.insertFolder();
    })
      .then(() => {
      return this.insertChild(this.currentFile);
    })
      .then(() => {
      return this.listChildren();
    })
      .then(() => {
      return this.getChild();
    })
      .then(() => {
      return this.deleteChild();
    })
      .then(() => {
      return this.insertParent(this.currentFile);
    })
      .then(() => {
      return this.listParents();
    })
      .then(() => {
      return this.getParent();
    })
      .then(() => {
      return this.deleteParent();
    })
      .then(() => {
      return this.insertPermission(this.currentFile.id);
    })
      .then(() => {
      return this.listPermissions();
    })
      .then(() => {
      return this.getPermission();
    })
      .then(() => {
      return this.updatePermission();
    })
      .then(() => {
      return this.getpermissionIdForEmail(this.email)
    })
      .then(() => {
      return this.patchPermission();
    })
      .then(() => {
      return this.deletePermission();
    })


      .then(() => {
      return this.listRevisions();
    })
      .then(() => {
      return this.getRevision();
    })
      .then(() => {
      return this.updateRevision();
    })
      .then(() => {
      return this.patchRevision();
    })
      .then(() => {
      return this.deleteRevision();
    })



    // finally...
      .then(() => {
      return this.deleteFile(this.currentFolder.id)
    })
      .then(() => {
      return this.deleteFile(this.currentFile.id)
    })
      .then(() => {
      return this.emptyTrash()
    })
      .catch((reason) => {
      console.error('There was an error: ', reason);
    }
      );
  }


	/*
	 Each function follows the same pattern. I've commented the getFile. The rest are structured the same way.

	 The goal of each function is to update the UI with what it is about to do, then do it, then update the UI with part
	 of the response, finally returning the promise so the function calls can be chained together.
	 */


	/**
	 * Get the About object for this user
	 *
	 * @returns {mng.IPromise<{data: IDriveAbout}>} The promise for chaining
	 */
  getAbout(): ng.IPromise<ngDrive.IDriveAbout> {
    // create a step object containing what we're about to do
    var currentStep = { op: 'Getting about', status: '...', data: undefined };
    // push that step object onto the list which is displayed via an ng-repeat
    this.steps.push(currentStep);
    // do the get, storing its ResponseObject in ro
    var ro = this.DriveService.about.get({ includeSubscribed: true });
    // create a then function on ro which will execute on completion
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveAbout>) => {
      // update the display with the status and response data
      currentStep.status = 'done';
      currentStep.data = resp.data.user + ' change id=' + resp.data.largestChangeId;
      this.largestChangeId = resp.data.largestChangeId;
    });
    // return the promise for chaining
    return ro.promise;
  }


	/**
	 * Get a change
	 *
	 * @returns {mng.IPromise<{data: IDriveAbout}>} The promise for chaining
	 */
  listChanges(id: number): ng.IPromise<ngDrive.IDriveChange> {
    // create a step object containing what we're about to do
    var currentStep = { op: 'Listing changes ', status: '...', data: undefined };
    // push that step object onto the list which is displayed via an ng-repeat
    this.steps.push(currentStep);
    // do the get, storing its ResponseObject in ro
    var ro = this.DriveService.changes.list({ startChangeId: id, maxResults: 989 });
    // create a then function on ro which will execute on completion
    ro.promise.then((resp) => {
      // update the display with the status and response data
      currentStep.status = 'done';
      currentStep.data = ' change count=' + resp.data.items.length;
    });
    // return the promise for chaining
    return ro.promise;
  }

	/**
	 * Get a change
	 *
	 * @returns {mng.IPromise<{data: IDriveAbout}>} The promise for chaining
	 */
  getChange(id: number): ng.IPromise<ngDrive.IDriveChange> {
    // create a step object containing what we're about to do
    var currentStep = { op: 'Getting change ' + id, status: '...', data: undefined };
    // push that step object onto the list which is displayed via an ng-repeat
    this.steps.push(currentStep);
    // do the get, storing its ResponseObject in ro
    var ro = this.DriveService.changes.get({ changeId: id });
    // create a then function on ro which will execute on completion
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveChange>) => {
      // update the display with the status and response data
      currentStep.status = 'done';
      currentStep.data = ' change id=' + resp.data.id;
    },
      () => {
        currentStep.status = 'failed';
        currentStep.data = 'This call often fails on Drive. Just refresh the page and it will probably succeed';
      }
      );
    // return the promise for chaining
    return ro.promise;
  }

	/**
	 * Get a file's metadata for a given id
	 *
	 * @param id  The file ID
	 * @returns {mng.IPromise<{data: IDriveFile}>} The promise for chaining
	 */
  getFile(id: string): ng.IPromise<ngDrive.IDriveFile> {
    // create a step object containing what we're about to do
    var currentStep = { op: 'Getting a file', status: '...', data: undefined };
    // push that step object onto the list which is displayed via an ng-repeat
    this.steps.push(currentStep);
    // do the get, storing its ResponseObject in ro
    var ro = this.DriveService.files.get({ fileId: id });
    // create a then function on ro which will execute on completion
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      // update the display with the status and response data
      currentStep.status = 'done';
      currentStep.data = resp.data.title;
    });
    // return the promise for chaining
    return ro.promise;
  }

	/**
	 * create count files with a title of 'title-n' and contents 'content for title-n'.
	 * Much of the code in this function is to deal with the feature of inserting n files
	 * and only returning when all n have been succesful. It does this by creating a new
	 * deferred.promise to wrap the file.insert promise from each file.
	 *
	 * @param title stub of the title
	 * @param count how many files
	 * @returns {mng.IPromise<{data: IDriveFile}>}
	 */
  insertFiles(title: string, count: number): ng.IPromise<ngDrive.IDriveFile> {
    var contentBase = 'content for ';
    var doneCount = 0;
    var currentStep = { op: 'Inserting ' + count + ' files', status: '' + doneCount, data: undefined };
    this.steps.push(currentStep);

    var def = this.$q.defer();

    for (var i = 0; i < count; i++) {
      this.DriveService.files.insertWithContent({
        title: title + '-' + i,
        mimeType: 'text/plain'
      }, { uploadType: 'multipart' }, btoa(contentBase + title + '-' + i), 'base64').promise.then(
        (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
          currentStep.status = '' + ++doneCount;
          currentStep.data = resp.data.id + ' , content length = ' + resp.data.fileSize;
          this.currentFile = resp.data;
          if (doneCount == count) {
            currentStep.status = 'done';
            def.resolve();
          }
          // check count then resolve
        }
        , (reason) => { def.reject(reason) });
    }
    return def.promise;
  }


  /**
   * Insert a test text file with content using resumable/chunked upload
   * @param title stub of the title
   * @returns {mng.IPromise<{data: IDriveFile}>}
   */
  resumable(title: string): ng.IPromise<ngDrive.IDriveFile> {
    var content = '123456789.';
    for (var i = 1; i < 16; i++) {
      content += content;
    }
    console.log(content.length); // 1k

    var transferEncoding;
    // base64 version
    content = btoa(content);
    transferEncoding = 'base64';
    // end of base64

    var currentStep = { op: 'Inserting ' + content.length + ' long file', status: '', data: undefined };
    this.steps.push(currentStep);

    var def = this.$q.defer();

    this.DriveService.files.insertWithContent({
      title: title,
      mimeType: 'text/plain'
    }, { uploadType: 'resumable' }, content, transferEncoding).promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.data = resp.data.id + ' , content length = ' + resp.data.fileSize;
        this.currentFile = resp.data;
      }
      , (reason) => { def.reject(reason) },
      (position) => {
        console.log('notification at position ' + position);
        currentStep.data = 'progress = ' + position;
      });
    return def.promise;
  }



  getFileContents(id: string): ng.IPromise<any> {
    var currentStep = { op: 'Getting a file\'s contents', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.get({ fileId: id, alt: 'media' });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<any>) => {
      currentStep.status = 'done';
      currentStep.data = resp.data;
    });
    return ro.promise;
  }

  patchFileTitle(id: string, newTitle: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Using Patch to update a file\'s title', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.patch({
      fileId: id,
      resource: { title: newTitle }
    });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = resp.data.title;
    });
    return ro.promise;
  }

  updateFileTitle(id: string, newTitle: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Using Update to update a file\'s title', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.update({ title: newTitle }, { fileId: id });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = resp.data.title;
    });
    return ro.promise;
  }

  updateFileContent(id: string, newContent: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Using Update to update a file\'s content', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.update(undefined, {
      fileId: id,
      uploadType: 'media'
    }, newContent);
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = 'content length = ' + resp.data.fileSize;
    });
    return ro.promise;
  }

  touchFile(id: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Using Touch to update a file\'s last modified date', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.touch({ fileId: id });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = resp.data.modifiedDate;
    });
    return ro.promise;
  }

  trashFile(id: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Trash a file', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.trash({ fileId: id });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = 'trashed=' + resp.data.labels.trashed;
    });
    return ro.promise;
  }

  untrashFile(id: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Untrash a file', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.untrash({ fileId: id });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = 'trashed=' + resp.data.labels.trashed;
    });
    return ro.promise;
  }

  deleteFile(id: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Delete a file', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.del({ fileId: id });
    ro.promise.then((resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
      currentStep.status = 'done';
      currentStep.data = resp.data;
    });
    return ro.promise;
  }

  emptyTrash(): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Empty trash', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.emptyTrash();
    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
        currentStep.data = resp.data;
      },
      (resp) => {
        currentStep.status = 'failed';
        currentStep.data = resp + '  will fail if user granted insufficient privilege to empty trash';
      });
    return ro.promise;
  }

  watchFile(id: string): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Using Watch to get a file\'s update channel', status: '...', data: undefined };
    this.steps.push(currentStep);
    var watchBody = {
      id: 'aUUID',
      type: 'web_hook',
      address: 'dev.clevernote.co:8888'
    };
    var ro = this.DriveService.files.watch({
      fileId: id,
      alt: 'media'
    }, watchBody);
    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<any>) => {
        currentStep.status = 'done';
        currentStep.data = resp.data.kind + " " + resp['resourceUri'];
      });
    return ro.promise;
  }

  displayTitle(expect: string, title: string) {
    this.$log.info("chained title (" + expect + ")= " + title);
  }


  insertFolder(): ng.IPromise<ngDrive.IDriveFile> {
    var currentStep = { op: 'Making a folder', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.files.insert({
      title: 'delmeZZZ testfolder',
      mimeType: 'application/vnd.google-apps.folder'
    }, false);
    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
        this.currentFolder = resp.data;
      });
    return ro.promise;
  }


	/*
	   CHILDREN
	 */

  insertChild(child: ngDrive.IDriveFile): ng.IPromise<ngDrive.IDriveChild> {
    var currentStep = { op: 'Making a child', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.children.insert({ folderId: this.currentFolder.id }, child);

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


  getChild(): ng.IPromise<ngDrive.IDriveChild> {
    var currentStep = { op: 'Getting a child', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.children.get({ folderId: this.currentFolder.id, childId: this.currentFile.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


  listChildren(): ng.IPromise<ngDrive.IDriveChild> {
    var currentStep = { op: 'Listing all children', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.children.list({ folderId: this.currentFolder.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveChildList>) => {
        currentStep.status = '' + resp.data.items.length;
      });
    return ro.promise;
  }


  deleteChild(): ng.IPromise<ngDrive.IDriveChild> {
    var currentStep = { op: 'Deleting a child', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.children.del({ folderId: this.currentFolder.id, childId: this.currentFile.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


	/*
	 PARENTS
	 */

  insertParent(child: ngDrive.IDriveFile): ng.IPromise<ngDrive.IDriveParent> {
    var currentStep = { op: 'Making a parent', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.parents.insert({ fileId: child.id }, this.currentFolder);

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


  getParent(): ng.IPromise<ngDrive.IDriveParent> {
    var currentStep = { op: 'Getting a parent', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.parents.get({ fileId: this.currentFile.id, parentId: this.currentFolder.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


  listParents(): ng.IPromise<ngDrive.IDriveParent> {
    var currentStep = { op: 'Listing all parents', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.parents.list({ fileId: this.currentFile.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveParentList>) => {
        currentStep.status = '' + resp.data.items.length;
      });
    return ro.promise;
  }


  deleteParent(): ng.IPromise<ngDrive.IDriveParent> {
    var currentStep = { op: 'Deleting a parent', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.parents.del({ fileId: this.currentFile.id, parentId: this.currentFolder.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


	/*
	 PERMISSIONS
	 */

  insertPermission(fileId): ng.IPromise<ngDrive.IDrivePermission> {
    var currentStep = { op: 'Making a permission', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.permissions.insert({ type: 'anyone', role: 'writer' }, { fileId: fileId });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDrivePermission>) => {
        currentStep.status = 'done';
        this.currentPermission = resp.data;
      });
    return ro.promise;
  }

  getPermission(): ng.IPromise<ngDrive.IDrivePermission> {
    var currentStep = { op: 'Getting a permission', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.permissions.get({ fileId: this.currentFile.id, permissionId: this.currentPermission.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  updatePermission(): ng.IPromise<ngDrive.IDrivePermission> {
    var currentStep = { op: 'Updating a permission', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.permissions.update({ type: 'domain', role: 'reader' }, { fileId: this.currentFile.id, permissionId: this.currentPermission.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  patchPermission(): ng.IPromise<ngDrive.IDrivePermission> {
    var currentStep = { op: 'Patching a permission', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.permissions.patch({ type: 'domain', role: 'reader' }, { fileId: this.currentFile.id, permissionId: this.currentPermission.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  listPermissions(): ng.IPromise<ngDrive.IDrivePermission> {
    var currentStep = { op: 'Listing all permissions for a file', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.permissions.list({ fileId: this.currentFile.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDrivePermissionList>) => {
        currentStep.status = '' + resp.data.items.length;
      });
    return ro.promise;
  }

  deletePermission(): ng.IPromise<ngDrive.IDrivePermission> {
    var currentStep = { op: 'Deleting a permission', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.permissions.del({ fileId: this.currentFile.id, permissionId: this.currentPermission.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  getpermissionIdForEmail(email: string): ng.IPromise<{ id?: string }> {
    var currentStep = { op: 'getting permission id for ' + this.email, status: '...', data: undefined };
    this.steps.push(currentStep);

    if (!this.email || this.email.length < 4) {
      currentStep.status = 'skipped because no email address provided';
      return;
    }
    var ro = this.DriveService.permissions.getIdForEmail(email);

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

	/*
	 REVISIONS
	 */

  getRevision(): ng.IPromise<ngDrive.IDriveRevision> {
    var currentStep = { op: 'Getting a revision', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.revisions.get({ fileId: this.currentFile.id, revisionId: this.currentRevision.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  updateRevision(): ng.IPromise<ngDrive.IDriveRevision> {
    var currentStep = { op: 'Updating a revision', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.revisions.update({ pinned: false }, { fileId: this.currentFile.id, revisionId: this.currentRevision.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  patchRevision(): ng.IPromise<ngDrive.IDriveRevision> {
    var currentStep = { op: 'Patching a revision', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.revisions.patch({ pinned: true }, { fileId: this.currentFile.id, revisionId: this.currentRevision.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }

  listRevisions(): ng.IPromise<ngDrive.IDriveRevision> {
    var currentStep = { op: 'Listing all revisions for a file', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.revisions.list({ fileId: this.currentFile.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveRevisionList>) => {
        currentStep.status = '' + resp.data.items.length;
        this.currentRevision = resp.data.items[0];
      });
    return ro.promise;
  }

  deleteRevision(): ng.IPromise<ngDrive.IDriveRevision> {
    var currentStep = { op: 'Deleting a revision', status: '...', data: undefined };
    this.steps.push(currentStep);
    var ro = this.DriveService.revisions.del({ fileId: this.currentFile.id, revisionId: this.currentRevision.id });

    ro.promise.then(
      (resp: ng.IHttpPromiseCallbackArg<ngDrive.IDriveFile>) => {
        currentStep.status = 'done';
      });
    return ro.promise;
  }


}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
  .controller('MaximalCtrl', MaximalCtrl1);
