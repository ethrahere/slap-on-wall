export type PostIt = {
  id: string;
  text: string;
  color: string;
  signature: string | null;
  isAnonymous: boolean;
  createdAt: string;
  hearts: number;
  position: number;
  ipHash: string | null;
  shares: number;
};

export type Heart = {
  postItId: string;
  ipHash: string;
  createdAt: string;
};

export type NewPostItPayload = {
  text: string;
  color: string;
  signature?: string | null;
  isAnonymous: boolean;
};

export type PostItFormState = NewPostItPayload & {
  id?: string;
};
