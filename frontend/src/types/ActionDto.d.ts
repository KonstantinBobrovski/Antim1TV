export enum Actions {
  LoadFirst,
  LoadPrevious,
  LoadNext,
  LoadNew,
  DownVolume,
  UpVolume,
  Mute,
  Pause,
  Play,
  RefreshPage,
  //State of youtube iframe
  AskForState,
}

export type ActionDto = {
  queueId: number;
  action: Actions;
};
