export interface Power {
  id: string;
  name: string;
  cost: number;
  cooldown: number;
  target: 'player';
  sameIntensityOnly: boolean;
  optionsShown: number;
  rules: {
    noRepeatTargetBackToBack: boolean;
    refundIfNoCards: boolean;
  };
}
