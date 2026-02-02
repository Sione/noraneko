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
    // 自動バックアップ
    autoBackup();
    
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
    // 自動バックアップ
    autoBackup();
    
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
export function createBackup(): void {
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
    
    console.log(`Backup created successfully: ${new Date(backup.timestamp).toLocaleString('ja-JP')}`);
  } catch (error) {
    console.error('Failed to create backup:', error);
  }
}

/**
 * 自動バックアップの実行（保存前に呼び出される）
 */
export function autoBackup(): void {
  try {
    const backups = getBackups();
    
    // 最新のバックアップから1分以上経過している場合のみバックアップを作成
    if (backups.length === 0 || Date.now() - backups[0].timestamp > 60000) {
      createBackup();
    }
  } catch (error) {
    console.error('Auto backup failed:', error);
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
    
    // 復元前に現在のデータをバックアップ
    createBackup();
    
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(backup.players));
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(backup.teams));
    
    console.log(`Data restored from backup: ${new Date(timestamp).toLocaleString('ja-JP')}`);
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

/**
 * バックアップの削除
 */
export function deleteBackup(timestamp: number): boolean {
  try {
    const backups = getBackups();
    const filteredBackups = backups.filter((b) => b.timestamp !== timestamp);
    
    if (filteredBackups.length === backups.length) {
      console.error('Backup not found:', timestamp);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(filteredBackups));
    console.log(`Backup deleted: ${new Date(timestamp).toLocaleString('ja-JP')}`);
    return true;
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return false;
  }
}

/**
 * すべてのバックアップを削除
 */
export function clearAllBackups(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY_BACKUP);
    console.log('All backups cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear backups:', error);
    return false;
  }
}

/**
 * 整合性チェック結果
 */
export interface IntegrityCheckResult {
  isValid: boolean;
  errors: {
    type: 'player' | 'team' | 'reference' | 'corruption';
    severity: 'error' | 'warning';
    message: string;
    details?: any;
  }[];
  warnings: string[];
  stats: {
    totalPlayers: number;
    validPlayers: number;
    totalTeams: number;
    validTeams: number;
    orphanedPlayers: number;
    brokenReferences: number;
  };
}

/**
 * データの整合性チェック
 */
export function checkDataIntegrity(): IntegrityCheckResult {
  const errors: IntegrityCheckResult['errors'] = [];
  const warnings: string[] = [];
  
  let totalPlayers = 0;
  let validPlayers = 0;
  let totalTeams = 0;
  let validTeams = 0;
  let orphanedPlayers = 0;
  let brokenReferences = 0;
  
  try {
    const players = loadPlayers();
    const teams = loadTeams();
    
    totalPlayers = players.length;
    totalTeams = teams.length;
    
    // 選手データの整合性チェック
    for (const player of players) {
      if (!validatePlayer(player)) {
        errors.push({
          type: 'player',
          severity: 'error',
          message: `Invalid player data: ${player.name || player.id}`,
          details: player,
        });
      } else {
        validPlayers++;
      }
      
      // 能力値の詳細チェック
      const abilityErrors = validatePlayerAbilities(player);
      if (abilityErrors.length > 0) {
        errors.push({
          type: 'player',
          severity: 'error',
          message: `Player ${player.name} has invalid abilities`,
          details: abilityErrors,
        });
      }
      
      // 孤立した選手のチェック（どのチームにも所属していない）
      const belongsToTeam = teams.some((t) => t.roster.includes(player.id));
      if (!belongsToTeam) {
        orphanedPlayers++;
        warnings.push(`Player ${player.name} is not assigned to any team`);
      }
    }
    
    // チームデータの整合性チェック
    for (const team of teams) {
      if (!validateTeam(team)) {
        errors.push({
          type: 'team',
          severity: 'error',
          message: `Invalid team data: ${team.name || team.id}`,
          details: team,
        });
      } else {
        validTeams++;
      }
      
      // ロースター内の選手が存在するかチェック
      for (const playerId of team.roster) {
        const player = players.find((p) => p.id === playerId);
        if (!player) {
          brokenReferences++;
          errors.push({
            type: 'reference',
            severity: 'error',
            message: `Team ${team.name} references non-existent player in roster`,
            details: { teamId: team.id, playerId },
          });
        }
      }
      
      // 打順内の選手が存在するかチェック
      for (const playerId of team.defaultLineup) {
        const player = players.find((p) => p.id === playerId);
        if (!player) {
          brokenReferences++;
          errors.push({
            type: 'reference',
            severity: 'error',
            message: `Team ${team.name} lineup references non-existent player`,
            details: { teamId: team.id, playerId },
          });
        } else if (!team.roster.includes(playerId)) {
          errors.push({
            type: 'reference',
            severity: 'warning',
            message: `Team ${team.name} lineup contains player not in roster`,
            details: { teamId: team.id, playerId, playerName: player.name },
          });
        }
      }
      
      // ロースターの重複チェック
      const uniqueRoster = new Set(team.roster);
      if (uniqueRoster.size !== team.roster.length) {
        errors.push({
          type: 'team',
          severity: 'warning',
          message: `Team ${team.name} has duplicate players in roster`,
          details: { teamId: team.id },
        });
      }
      
      // 打順の重複チェック
      const uniqueLineup = new Set(team.defaultLineup);
      if (uniqueLineup.size !== team.defaultLineup.length) {
        errors.push({
          type: 'team',
          severity: 'error',
          message: `Team ${team.name} has duplicate players in lineup`,
          details: { teamId: team.id },
        });
      }
    }
    
    // localStorageの容量チェック
    const storageUsed = new Blob([
      localStorage.getItem(STORAGE_KEY_PLAYERS) || '',
      localStorage.getItem(STORAGE_KEY_TEAMS) || '',
      localStorage.getItem(STORAGE_KEY_BACKUP) || '',
    ]).size;
    
    const storageLimit = 5 * 1024 * 1024; // 5MB
    if (storageUsed > storageLimit * 0.8) {
      warnings.push(`Storage usage is at ${Math.round((storageUsed / storageLimit) * 100)}% - consider cleaning up old data`);
    }
    
    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
      stats: {
        totalPlayers,
        validPlayers,
        totalTeams,
        validTeams,
        orphanedPlayers,
        brokenReferences,
      },
    };
  } catch (error) {
    errors.push({
      type: 'corruption',
      severity: 'error',
      message: `Data integrity check failed: ${error}`,
    });
    return {
      isValid: false,
      errors,
      warnings,
      stats: {
        totalPlayers,
        validPlayers,
        totalTeams,
        validTeams,
        orphanedPlayers,
        brokenReferences,
      },
    };
  }
}

/**
 * エクスポートオプション
 */
export interface ExportOptions {
  scope: 'all' | 'team' | 'selected';
  includeTeams?: boolean;
  includeHistory?: boolean;
  teamId?: string;
  playerIds?: string[];
}

/**
 * データのエクスポート
 */
export function exportData(options: ExportOptions = { scope: 'all', includeTeams: true }): string {
  const allPlayers = loadPlayers();
  const teams = options.includeTeams ? loadTeams() : [];
  
  let players: Player[] = [];
  
  switch (options.scope) {
    case 'all':
      players = allPlayers;
      break;
    case 'team':
      if (options.teamId) {
        const team = teams.find((t) => t.id === options.teamId);
        if (team) {
          players = allPlayers.filter((p) => team.roster.includes(p.id));
        }
      }
      break;
    case 'selected':
      if (options.playerIds && options.playerIds.length > 0) {
        players = allPlayers.filter((p) => options.playerIds!.includes(p.id));
      }
      break;
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    scope: options.scope,
    players,
    teams: options.includeTeams ? teams : [],
    metadata: {
      playerCount: players.length,
      teamCount: teams.length,
    },
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * インポートオプション
 */
export interface ImportOptions {
  overwriteDuplicates?: boolean;
  skipDuplicates?: boolean;
  validateAbilities?: boolean;
  createBackup?: boolean;
}

/**
 * インポート結果
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  overwritten: number;
  errors: { name: string; reason: string }[];
}

/**
 * データのインポート
 */
export function importData(
  jsonData: string,
  options: ImportOptions = {
    validateAbilities: true,
    createBackup: true,
  }
): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    skipped: 0,
    overwritten: 0,
    errors: [],
  };
  
  try {
    // インポート前にバックアップを作成
    if (options.createBackup !== false) {
      createBackup();
    }
    
    const importedData = JSON.parse(jsonData);
    
    // バージョンチェック
    if (importedData.version && importedData.version !== '1.0') {
      result.errors.push({
        name: 'version',
        reason: `Unsupported data version: ${importedData.version}`,
      });
      return result;
    }
    
    // データフォーマットの確認
    if (!importedData.players || !Array.isArray(importedData.players)) {
      result.errors.push({
        name: 'format',
        reason: 'Invalid import data format: missing players array',
      });
      return result;
    }
    
    const existingPlayers = loadPlayers();
    const existingTeams = loadTeams();
    const newPlayers = [...existingPlayers];
    const newTeams = [...existingTeams];
    
    // 選手データのインポート
    for (const player of importedData.players) {
      // バリデーション
      if (!validatePlayer(player)) {
        const errors = getPlayerValidationErrors(player);
        result.errors.push({
          name: player.name || player.id || 'Unknown',
          reason: errors.join(', '),
        });
        result.skipped++;
        continue;
      }
      
      // 能力値の詳細バリデーション
      if (options.validateAbilities) {
        const abilityErrors = validatePlayerAbilities(player);
        if (abilityErrors.length > 0) {
          result.errors.push({
            name: player.name,
            reason: `Invalid abilities: ${abilityErrors.join(', ')}`,
          });
          result.skipped++;
          continue;
        }
      }
      
      const existingIndex = newPlayers.findIndex((p) => p.id === player.id);
      
      if (existingIndex >= 0) {
        if (options.overwriteDuplicates) {
          newPlayers[existingIndex] = player;
          result.overwritten++;
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
          result.errors.push({
            name: team.name || team.id || 'Unknown',
            reason: 'Invalid team data structure',
          });
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
    if (!savePlayers(newPlayers)) {
      result.errors.push({
        name: 'save',
        reason: 'Failed to save player data',
      });
      return result;
    }
    
    if (!saveTeams(newTeams)) {
      result.errors.push({
        name: 'save',
        reason: 'Failed to save team data',
      });
      return result;
    }
    
    result.success = true;
    return result;
  } catch (error) {
    result.errors.push({
      name: 'system',
      reason: `Import failed: ${error}`,
    });
    return result;
  }
}

/**
 * 選手のバリデーションエラーを取得
 */
function getPlayerValidationErrors(player: any): string[] {
  const errors: string[] = [];
  
  if (!player.id) errors.push('Missing ID');
  if (!player.name) errors.push('Missing name');
  if (!player.position) errors.push('Missing position');
  if (!player.batterHand) errors.push('Missing batterHand');
  if (!player.batting) errors.push('Missing batting abilities');
  if (!player.running) errors.push('Missing running abilities');
  if (!player.fielding) errors.push('Missing fielding abilities');
  
  return errors;
}

/**
 * 選手能力値の詳細バリデーション
 */
function validatePlayerAbilities(player: Player): string[] {
  const errors: string[] = [];
  
  // 打撃能力のチェック
  if (player.batting) {
    Object.entries(player.batting).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 1 || value > 100) {
        errors.push(`batting.${key}: ${value}`);
      }
    });
  }
  
  // 投手能力のチェック
  if (player.pitching) {
    Object.entries(player.pitching).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 1 || value > 100) {
        errors.push(`pitching.${key}: ${value}`);
      }
    });
  }
  
  // 走塁能力のチェック
  if (player.running) {
    Object.entries(player.running).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 1 || value > 100) {
        errors.push(`running.${key}: ${value}`);
      }
    });
  }
  
  // 守備能力のチェック
  if (player.fielding) {
    Object.entries(player.fielding).forEach(([key, value]) => {
      if (key === 'positionRatings') return; // positionRatingsは別途チェック
      if (typeof value !== 'number' || value < 1 || value > 100) {
        errors.push(`fielding.${key}: ${value}`);
      }
    });
  }
  
  return errors;
}
