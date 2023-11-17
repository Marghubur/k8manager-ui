import { AfterViewChecked, Component, OnInit } from '@angular/core';
import 'bootstrap';
import { AjaxService } from '../services/ajax.service';
declare var $: any;
import { environment } from 'src/env/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewChecked {
  isLoading: boolean = false;
  folderDiscovery: FolderDiscover = {
    Files: [],
    Folders: [],
    RootDirectory: ""
  };
  baseUrl: string = environment.baseUrl
  currentPath: string = "";

  constructor(private http: AjaxService) { }

  ngAfterViewChecked(): void {
    $('[data-bs-toggle="tooltip"]').tooltip({
      trigger: 'hover'
    });

    $('[data-bs-toggle="tooltip"]').on('click', function () {
      $(this).tooltip('dispose');
    });
  }

  checkServiceStatus() {
    this.http.post(this.baseUrl + "Action/CheckStatus", { Command: "" }).subscribe(res => {
      if (res) {
        console.log(res);
      }
    });
  }

  ngOnInit(): void {
    this.loadData(this.folderDiscovery.RootDirectory);
  }

  loadData(directory: string) {
    this.isLoading = true;
    this.http.post("FolderDiscovery/GetFolder", {TargetDirectory: directory}).subscribe((res: any) => {
      if (res) {
        this.folderDiscovery = res;
        if (this.currentPath === "")
          this.currentPath = this.folderDiscovery.RootDirectory;

        this.isLoading = false;
      }
    }, (err) => {
      this.isLoading = false;
      alert(err.message);
    })
  }

  viewFolder(item: string) {
    if (item) {
      this.currentPath = item;
      this.loadData(item);
    }
  }

  backToFolder() {
    let parts = this.currentPath.split('\\');

    // Remove the last two items
    parts.splice(-1);

    // Join the remaining parts back into a string
    this.currentPath = parts.join('\\');
    this.loadData(this.currentPath);
  }

  runFile(fileDetail: any) {
    this.isLoading = true;
    this.http.post("Action/RunFile", fileDetail).subscribe((res: any) => {
      if (res) {
        this.isLoading = false;
      }
    }, (err) => {
      this.isLoading = false;

    })
  }

  reRunFile(fileDetail: any) {
    this.isLoading = true;
    this.http.post("Action/ReRunFile", fileDetail).subscribe((res: any) => {
      if (res) {
        this.isLoading = false;
      }
    }, (err) => {
      this.isLoading = false;

    })
  }

  stopFile(fileDetail: any) {
    this.isLoading = true;
    this.http.post("Action/StopFile", fileDetail).subscribe((res: any) => {
      if (res) {
        this.isLoading = false;
      }
    }, (err) => {
      this.isLoading = false;

    })
  }

  checkStatus(fileDetail: any) {
    this.isLoading = true;
    this.http.post("Action/CheckStatus", fileDetail).subscribe((res: string) => {
      if (res) {
        this.isLoading = false;
      }
    }, (err) => {
      this.isLoading = false;

    })
  }

}


enum Status {
  Passed= 1,
  Failed= 2,
  Running = 3,
  Warning = 4
}

interface FolderDiscover {
  Folders: Array<string>,
  Files: Array<any>,
  RootDirectory: string
}
