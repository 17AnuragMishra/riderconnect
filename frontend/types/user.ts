export interface UserInfo {
    _id?: string;
    name: string;
    profileImage?: string;
    firstName?: string;
    lastName?: string;
  }
  
  export interface BasicUserInfo {
    find(arg0: (host: any) => boolean): unknown;
    _id: string;
    username?: string;
    name?: string;
    email?: string;
    personalInfo: {
      firstName?: string;
      lastName?: string;
    };
    profilePic?: string;
  }
  