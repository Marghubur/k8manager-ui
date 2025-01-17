import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { AjaxService } from '../services/ajax.service';
import { Subject, interval, switchMap, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { RouteDatahandler } from '../services/RouteDatahandler';
import 'bootstrap';
declare var $: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewChecked {
  isLoading: boolean = false;
  isReady: boolean = false;
  gitHubContent: Array<GitHubContent> = [];
  command: string = null;
  cmdType: string = "linux";
  fileDetail: Array<any> = [];
  allFolders: Array<GitHubContent> = [];
  selectedFolder: any = null;
  private destroy$ = new Subject<void>();
  isBackBtnEnable: boolean = false;

  constructor(
    private http: AjaxService,
    private router: Router,
    private routeData: RouteDatahandler
    ) { }

  ngAfterViewChecked(): void {
    $('[data-bs-toggle="tooltip"]').tooltip({
      trigger: 'hover'
    });

    $('[data-bs-toggle="tooltip"]').on('click', function () {
      $(this).tooltip('dispose');
    });
  }

  checkServiceStatus() {
    this.http.post("Action/CheckStatus", { Command: "test" }).subscribe(res => {
      if (res.ResponseBody) {
        console.log(res.ResponseBody);
      }
    });
  }

  reRunFile(fileDetail: any) {
    if (fileDetail) {
      this.runAndRetryForStatus(fileDetail, "Action/ReRunFile");
    }
  }

  stopFile(fileDetail: any) {
    if (fileDetail) {
      this.runAndRetryForStatus(fileDetail, "Action/StopFile");
    }
  }

  checkStatus(fileDetail: any) {
    if (fileDetail) {
      this.runAndRetryForStatus(fileDetail, "Action/CheckStatus");
    }
  }

  runFile(fileDetail: any) {
    if (fileDetail) {
      this.runAndRetryForStatus(fileDetail, "Action/RunFile");
    }
  }

  runAndRetryForStatus(fileDetail: any, url: string): void {
    const timer$ = interval(10000); // Adjust the interval as needed
    let counter = 0;
    fileDetail.IsLoading = true;
    timer$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.http.post(url, {
          Name: fileDetail.Name,
          Url: fileDetail.Url,
          DownloadUrl: fileDetail.DownloadUrl,
          Type: fileDetail.Type,
          GitUrl: fileDetail.GitUrl,
          Path: fileDetail.Path
        }))
      )
      .subscribe((res: any) => {
        if (res && res.HttpStatusCode == 200) {
          let detail = res.ResponseBody;
          if (detail.Name) {
            console.log('Received data:', detail.Name);
            fileDetail.IsLoading = false;
            fileDetail.Status = detail.Status;
            this.stopTimer();
          }
        }

        counter++;
        // Check if it's the 5th request, then stop the timer
        if (counter === 5 ) {
          fileDetail.IsLoading = false;
          this.stopTimer();
        }
      },
        (error) => {
          console.error('Error...');
          fileDetail.IsLoading = false;
          this.stopTimer();
        }
      );
  }

  private stopTimer(): void {
    console.log('Stopping timer.');
    this.destroy$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.loadData("");
    let data = this.routeData.getData();
    if (data) {
      this.getFileList(data.Path , data.FolderName);
    }
  }

  loadData(directory: string) {
    this.isLoading = true;
    this.isReady = false;
    this.http.post("FolderDiscovery/GetAllFolder", { TargetDirectory: directory }).subscribe((res: any) => {
      if (res.ResponseBody) {
        this.gitHubContent = res.ResponseBody;
        this.allFolders = res.ResponseBody;

      }

      this.isLoading = false;
      this.isReady = true;
    }, (err) => {
      this.isLoading = false;
      this.isReady = true;
      alert(err.message);
    })
  }

  getFileList(Path: string, FolderName: string) {
    if (Path && Path != "" && FolderName && FolderName != "") {
      this.http.post("FolderDiscovery/GetAllFile", { TargetDirectory: Path })
        .subscribe((res: any) => {
          if (res.ResponseBody) {
            this.selectedFolder = {
              Name: FolderName,
              Path: Path
            }
            this.fileDetail = res.ResponseBody;
            if (this.fileDetail.length > 0) {
              this.isBackBtnEnable = true;
              this.fileDetail.forEach(x => {
                x.IsLoading = false;
              })
            }
            else {
              this.isBackBtnEnable = false;
              this.fileDetail = [];
            }

            let data = this.routeData.getData();
            if (data) {
              this.routeData.removeData();
            }
          }
        }, (err) => {
          alert(err.message);
        })
    } else {

    }
  }

  viewFolder(item: string) {
    if (item) {
      this.loadData(item);
    }
  }

  backToFolder() {
    let currentPath;
    let folder;
    if (this.selectedFolder.Path.includes("/")) {
      let parts = this.selectedFolder.Path.split('/');

      // Remove the last two items
      parts.splice(-1);

      // Join the remaining parts back into a string
      currentPath = parts.join('/');
      folder = parts.slice(-1)[0];
    } else {
      let parts = this.selectedFolder.Path.split('\\');
      parts.splice(-1);
      currentPath = parts.join("\\");
    }
    console.log(currentPath);
    this.getFileList(currentPath, folder);
  }

  runCustomCommand() {
    if (this.command) {
      this.isLoading = true;
      let value = {
        Command: this.command,
        isWindow: this.cmdType.toLowerCase() === "window" ? true : false,
        isMicroK8: this.cmdType.toLowerCase() === "mickrok8" ? true : false,
        isLinux: this.cmdType.toLowerCase() === "linux" ? true : false,
        FilePath: ""
      }

      this.http.post("FolderDiscovery/RunCommand", value).subscribe((res: any) => {
        if (res.ResponseBody) {
          alert(res.ResponseBody);
        }
        this.isLoading = false;
      }, (err) => {
        this.isLoading = false;
        console.log(err)
      })
    }
  }

  searchFolder(e: any) {
    let value = e.target.value;
    if (value && value != "") {
      this.gitHubContent = this.allFolders.filter(x => x.Name.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
    } else {
      this.gitHubContent = this.allFolders;
    }
  }

  resetSearch(e: any) {
    e.target.value = "";
    this.gitHubContent = this.allFolders;
  }

  loadFileEditor(file: any) {
    this.routeData.setData(file);
    this.router.navigateByUrl("editor");
  }
}


enum Status {
  Passed = 1,
  Failed = 2,
  Running = 3,
  Warning = 4
}

interface GitHubContent {
  Name: string,
  Url: string,
  DownloadUrl: string,
  Type: string,
  GitUrl: string,
  Path: string,
  Status: boolean,
  FileType: string
}
