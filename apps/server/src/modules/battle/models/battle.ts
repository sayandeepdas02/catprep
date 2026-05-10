import mongoose, { Document, Schema } from 'mongoose';

export type BattleMode = '1v1' | 'topic_duel' | 'speed_challenge' | 'survival';
export type BattleStatus = 'waiting' | 'ready' | 'in_progress' | 'completed' | 'cancelled';

export interface IBattleRoom extends Document {
  roomCode: string;
  mode: BattleMode;
  status: BattleStatus;
  
  hostId: mongoose.Types.ObjectId;
  opponentId?: mongoose.Types.ObjectId;
  
  topicId?: mongoose.Types.ObjectId;
  questionCount: number;
  timeLimit: number;
  
  questions: mongoose.Types.ObjectId[];
  currentQuestionIndex: number;
  
  scores: Map<string, number>;
  answers: Map<string, {
    questionIndex: number;
    answer: string | string[];
    isCorrect: boolean;
    time: number;
  }>;
  
  startedAt?: Date;
  completedAt?: Date;
  winnerId?: mongoose.Types.ObjectId;
}

const battleRoomSchema = new Schema<IBattleRoom>(
  {
    roomCode: { type: String, required: true, unique: true },
    mode: { type: String, enum: ['1v1', 'topic_duel', 'speed_challenge', 'survival'], required: true },
    status: { type: String, enum: ['waiting', 'ready', 'in_progress', 'completed', 'cancelled'], default: 'waiting' },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponentId: { type: Schema.Types.ObjectId, ref: 'User' },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    questionCount: { type: Number, default: 10 },
    timeLimit: { type: Number, default: 300 },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    currentQuestionIndex: { type: Number, default: 0 },
    scores: { type: Map, of: Number, default: {} },
    answers: { type: Map, of: Object, default: {} },
    startedAt: { type: Date },
    completedAt: { type: Date },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

battleRoomSchema.index({ roomCode: 1 });
battleRoomSchema.index({ status: 1 });
battleRoomSchema.index({ hostId: 1 });
battleRoomSchema.index({ opponentId: 1 });

export const BattleRoom = mongoose.model<IBattleRoom>('BattleRoom', battleRoomSchema);

export interface IBattleResult extends Document {
  roomId: mongoose.Types.ObjectId;
  mode: BattleMode;
  
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    score: number;
    correct: number;
    avgTime: number;
    rank: number;
  }>;
  
  winnerId: mongoose.Types.ObjectId;
  xpAwarded: Map<string, number>;
  
  completedAt: Date;
  duration: number;
}

const battleResultSchema = new Schema<IBattleResult>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'BattleRoom', required: true },
    mode: { type: String, required: true },
    participants: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      score: { type: Number, required: true },
      correct: { type: Number, required: true },
      avgTime: { type: Number, required: true },
      rank: { type: Number, required: true },
    }],
    winnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    xpAwarded: { type: Map, of: Number, default: {} },
    completedAt: { type: Date, required: true },
    duration: { type: Number, required: true },
  },
  { timestamps: true }
);

battleResultSchema.index({ 'participants.userId': 1 });

export const BattleResult = mongoose.model<IBattleResult>('BattleResult', battleResultSchema);

export interface IBattleInvite extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  mode: BattleMode;
  topicId?: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: Date;
}

const battleInviteSchema = new Schema<IBattleInvite>({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, required: true },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
  expiresAt: { type: Date, required: true },
});

battleInviteSchema.index({ toUserId: 1, status: 1 });

export const BattleInvite = mongoose.model<IBattleInvite>('BattleInvite', battleInviteSchema);