/**
 * 選手データの永続化とバックアップ管理
 */

import { Player, Team } from '../types';

const STORAGE_KEY_PLAYERS = 'baseball_custom_players';
const STORAGE_KEY_TEAMS = 'baseball_custom_teams';
const STORAGE_KEY_BACKUP = 'baseball_data_backup';
const MAX_BACKUPS = 10;

/**
 * バックアップデータ型
 */
interface BackupData {
  timestamp: number;
  players: Player[];
  teams: Team[];
}

/**
 * 選手データの保存
 */
export function savePlayers(players: Player[]): boolean {
  try {
    // バックアップ作成
    createBackup();
    
    const data = JSON.stringify(players);
    localStorage.setItem(STORAGE_KEY_PLAYERS, data);
    return true;
  } catch (error) {
    console.error('Failed to save players:', error);
    return false;
  }
}

/**
 * 選手データの読み込み
 */
export function loadPlayers(): Player[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PLAYERS);
    if (!data) {
      return [];
    }
    
    const players = JSON.parse(data);
    
    // バリデーション
    if (!Array.isArray(players)) {
      console.error('Invalid players data format');
      return [];
    }
    
    // 各選手データのバリデーション
    const validPlayers = players.filter((player) => validatePlayer(player));
    
    return validPlayers;
  } catch (error) {
    console.error('Failed to load players:', error);
    return [];
  }
}

/**
 * チームデータの保存
 */
export function saveTeams(teams: Team[]): boolean {
  try {
    // バックアップ作成
    createBackup();
    
    const data = JSON.stringify(teams);
    localStorage.setItem(STORAGE_KEY_TEAMS, data);
    return true;
  } catch (error) {
    console.error('Failed to save teams:', error);
    return false;
  }
}

/**
 * チームデータの読み込み
 */
export function loadTeams(): Team[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (!data) {
      return [];
    }
    
    const teams = JSON.parse(data);
    
    // バリデーション
    if (!Array.isArray(teams)) {
      console.error('Invalid teams data format');
      return [];
    }
    
    // 各チームデータのバリデーション
    const validTeams = teams.filter((team) => validateTeam(team));
    
    return validTeams;
  } catch (error) {
    console.error('Failed to load teams:', error);
    return [];
  }
}

/**
 * 選手データのバリデーション
 */
function validatePlayer(player: any): boolean {
  // 必須フィールドの確認
  if (
    !player.id ||
    !player.name ||
    !player.position ||
    !player.batterHand ||
    !player.batting ||
    !player.running ||
    !player.fielding
  ) {
    console.warn('Player missing required fields:', player);
    return false;
  }
  
  // 能力値の範囲チェック (1-100)
  const abilities = [
    ...Object.values(player.batting),
    ...Object.values(player.running),
    ...Object.values(player.fielding).filter((v) => typeof v === 'number'),
  ];
  
  for (const ability of abilities) {
    if (typeof ability !== 'number' || ability < 1 || ability > 100) {
      console.warn('Player has invalid ability value:', player.name, ability);
      return false;
    }
  }
  
  // 投手の場合、投手能力のチェック
  if (player.pitching) {
    const pitchingAbilities = Object.values(player.pitching);
    for (const ability of pitchingAbilities) {
      if (typeof ability !== 'number' || ability < 1 || ability > 100) {
        console.warn('Player has invalid pitching ability:', player.name, ability);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * チームデータのバリデーション
 */
function validateTeam(team: any): boolean {
  // 必須フィールドの確認
  if (
    !team.id ||
    !team.name ||
    !team.abbreviation ||
    !Array.isArray(team.roster) ||
    !Array.isArray(team.defaultLineup)
  ) {
    console.warn('Team missing required fields:', team);
    return false;
  }
  
  // ロースターの最小人数チェック (9人以上)
  if (team.roster.length < 9) {
    console.warn('Team has insufficient roster:', team.name);
    return false;
  }
  
  // デフォルト打順のチェック (9人)
  if (team.defaultLineup.length !== 9) {
    console.warn('Team has invalid lineup:', team.name);
    return false;
  }
  
  return true;
}

/**
 * バックアップの作成
 */
function createBackup(): void {
  try {
    const players = loadPlayers();
    const teams = loadTeams();
    
    const backup: BackupData = {
      timestamp: Date.now(),
      players,
      teams,
    };
    
    // 既存のバックアップを読み込み
    const backupsData = localStorage.getItem(STORAGE_KEY_BACKUP);
    let backups: BackupData[] = backupsData ? JSON.parse(backupsData) : [];
    
    // 新しいバックアップを追加
    backups.unshift(backup);
    
    // 最大数を超えたら古いものを削除
    if (backups.length > MAX_BACKUPS) {
      backups = backups.slice(0, MAX_BACKUPS);
    }
    
    localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(backups));
  } catch (error) {
    console.error('Failed to create backup:', error);
  }
}

/**
 * バックアップ一覧の取得
 */
export function getBackups(): BackupData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BACKUP);
    if (!data) {
      return [];
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get backups:', error);
    return [];
  }
}

/**
 * バックアップからの復元
 */
export function restoreFromBackup(timestamp: number): boolean {
  try {
    const backups = getBackups();
    const backup = backups.find((b) => b.timestamp === timestamp);
    
    if (!backup) {
      console.error('Backup not found:', timestamp);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(backup.players));
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(backup.teams));
    
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

/**
 * データの整合性チェック
 */
export function checkDataIntegrity(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    const players = loadPlayers();
    const teams = loadTeams();
    
    // 選手データの整合性チェック
    for (const player of players) {
      if (!validatePlayer(player)) {
        errors.push(`Invalid player data: ${player.name || player.id}`);
      }
    }
    
    // チームデータの整合性チェック
    for (const team of teams) {
      if (!validateTeam(team)) {
        errors.push(`Invalid team data: ${team.name || team.id}`);
      }
      
      // ロースター内の選手が存在するかチェック
      for (const playerId of team.roster) {
        const player = players.find((p) => p.id === playerId);
        if (!player) {
          errors.push(`Team ${team.name} references non-existent player: ${playerId}`);
        }
      }
      
      // 打順内の選手が存在するかチェック
      for (const playerId of team.defaultLineup) {
        const player = players.find((p) => p.id === playerId);
        if (!player) {
          errors.push(`Team ${team.name} lineup references non-existent player: ${playerId}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Data integrity check failed: ${error}`);
    return {
      isValid: false,
      errors,
    };
  }
}

/**
 * データのエクスポート
 */
export function exportData(includeTeams: boolean = true): string {
  const players = loadPlayers();
  const teams = includeTeams ? loadTeams() : [];
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    players,
    teams,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * データのインポート
 */
export function importData(
  jsonData: string,
  options: {
    overwriteDuplicates?: boolean;
    skipDuplicates?: boolean;
  } = {}
): {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
} {
  const result = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };
  
  try {
    const importedData = JSON.parse(jsonData);
    
    // データフォーマットの確認
    if (!importedData.players || !Array.isArray(importedData.players)) {
      result.errors.push('Invalid import data format');
      return result;
    }
    
    const existingPlayers = loadPlayers();
    const existingTeams = loadTeams();
    const newPlayers = [...existingPlayers];
    const newTeams = [...existingTeams];
    
    // 選手データのインポート
    for (const player of importedData.players) {
      if (!validatePlayer(player)) {
        result.errors.push(`Invalid player data: ${player.name || player.id}`);
        result.skipped++;
        continue;
      }
      
      const existingIndex = newPlayers.findIndex((p) => p.id === player.id);
      
      if (existingIndex >= 0) {
        if (options.overwriteDuplicates) {
          newPlayers[existingIndex] = player;
          result.imported++;
        } else if (options.skipDuplicates) {
          result.skipped++;
        } else {
          // デフォルトは名前を変更して追加
          player.id = `${player.id}_${Date.now()}`;
          player.name = `${player.name} (インポート)`;
          newPlayers.push(player);
          result.imported++;
        }
      } else {
        newPlayers.push(player);
        result.imported++;
      }
    }
    
    // チームデータのインポート
    if (importedData.teams && Array.isArray(importedData.teams)) {
      for (const team of importedData.teams) {
        if (!validateTeam(team)) {
          result.errors.push(`Invalid team data: ${team.name || team.id}`);
          continue;
        }
        
        const existingIndex = newTeams.findIndex((t) => t.id === team.id);
        
        if (existingIndex >= 0) {
          if (options.overwriteDuplicates) {
            newTeams[existingIndex] = team;
          } else if (options.skipDuplicates) {
            // スキップ
          } else {
            team.id = `${team.id}_${Date.now()}`;
            team.name = `${team.name} (インポート)`;
            newTeams.push(team);
          }
        } else {
          newTeams.push(team);
        }
      }
    }
    
    // 保存
    savePlayers(newPlayers);
    saveTeams(newTeams);
    
    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(`Import failed: ${error}`);
    return result;
  }
}
