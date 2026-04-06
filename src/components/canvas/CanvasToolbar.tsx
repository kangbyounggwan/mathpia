import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { CanvasTool, CanvasBackground } from '../../types';

interface CanvasToolbarProps {
  selectedTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  background: CanvasBackground;
  onBackgroundChange: (bg: CanvasBackground) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const COLORS = [
  { color: colors.canvasBlack, name: '검정' },
  { color: colors.canvasBlue, name: '파랑' },
  { color: colors.canvasRed, name: '빨강' },
  { color: colors.canvasGreen, name: '초록' },
];

const STROKE_WIDTHS = [
  { width: 1, label: '가늘게' },
  { width: 2, label: '보통' },
  { width: 4, label: '굵게' },
];

const TOOLS: { tool: CanvasTool; icon: string; label: string }[] = [
  { tool: 'pen', icon: 'pen', label: '펜' },
  { tool: 'pencil', icon: 'pencil', label: '연필' },
  { tool: 'highlighter', icon: 'marker', label: '형광펜' },
  { tool: 'eraser', icon: 'eraser', label: '지우개' },
];

const BACKGROUNDS: { bg: CanvasBackground; icon: string; label: string }[] = [
  { bg: 'blank', icon: 'rectangle-outline', label: '빈 배경' },
  { bg: 'grid', icon: 'grid', label: '모눈' },
  { bg: 'coordinate', icon: 'axis', label: '좌표' },
];

type DropdownType = 'tool' | 'color' | 'width' | 'background' | null;

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  background,
  onBackgroundChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);

  const toggleDropdown = (type: DropdownType) => {
    setActiveDropdown(activeDropdown === type ? null : type);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const selectedToolData = TOOLS.find(t => t.tool === selectedTool);
  const selectedBgData = BACKGROUNDS.find(b => b.bg === background);

  return (
    <View style={styles.container}>
      {/* 드롭다운 오버레이 */}
      {activeDropdown && (
        <Pressable style={styles.overlay} onPress={closeDropdown} />
      )}

      <View style={styles.toolbar}>
        {/* 도구 선택 드롭다운 */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[styles.dropdownButton, activeDropdown === 'tool' && styles.dropdownButtonActive]}
            onPress={() => toggleDropdown('tool')}
          >
            <MaterialCommunityIcons
              name={selectedToolData?.icon as any}
              size={22}
              color={colors.primary}
            />
            <Text style={styles.dropdownLabel}>{selectedToolData?.label}</Text>
            <MaterialCommunityIcons
              name={activeDropdown === 'tool' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {activeDropdown === 'tool' && (
            <View style={styles.dropdownMenu}>
              {TOOLS.map(({ tool, icon, label }) => (
                <TouchableOpacity
                  key={tool}
                  style={[
                    styles.dropdownItem,
                    selectedTool === tool && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onToolChange(tool);
                    closeDropdown();
                  }}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={20}
                    color={selectedTool === tool ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedTool === tool && styles.dropdownItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 색상 선택 드롭다운 */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[styles.dropdownButton, activeDropdown === 'color' && styles.dropdownButtonActive]}
            onPress={() => toggleDropdown('color')}
          >
            <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
            <Text style={styles.dropdownLabel}>색상</Text>
            <MaterialCommunityIcons
              name={activeDropdown === 'color' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {activeDropdown === 'color' && (
            <View style={styles.dropdownMenu}>
              {COLORS.map(({ color, name }) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.dropdownItem,
                    selectedColor === color && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onColorChange(color);
                    closeDropdown();
                  }}
                >
                  <View style={[styles.colorOption, { backgroundColor: color }]} />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedColor === color && styles.dropdownItemTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 굵기 선택 드롭다운 */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[styles.dropdownButton, activeDropdown === 'width' && styles.dropdownButtonActive]}
            onPress={() => toggleDropdown('width')}
          >
            <View style={[styles.widthPreviewSmall, { height: strokeWidth * 2 }]} />
            <Text style={styles.dropdownLabel}>굵기</Text>
            <MaterialCommunityIcons
              name={activeDropdown === 'width' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {activeDropdown === 'width' && (
            <View style={styles.dropdownMenu}>
              {STROKE_WIDTHS.map(({ width, label }) => (
                <TouchableOpacity
                  key={width}
                  style={[
                    styles.dropdownItem,
                    strokeWidth === width && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onStrokeWidthChange(width);
                    closeDropdown();
                  }}
                >
                  <View style={[styles.widthOption, { height: width * 2 }]} />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      strokeWidth === width && styles.dropdownItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 배경 선택 드롭다운 */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[styles.dropdownButton, activeDropdown === 'background' && styles.dropdownButtonActive]}
            onPress={() => toggleDropdown('background')}
          >
            <MaterialCommunityIcons
              name={selectedBgData?.icon as any}
              size={22}
              color={colors.primary}
            />
            <Text style={styles.dropdownLabel}>{selectedBgData?.label}</Text>
            <MaterialCommunityIcons
              name={activeDropdown === 'background' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {activeDropdown === 'background' && (
            <View style={styles.dropdownMenu}>
              {BACKGROUNDS.map(({ bg, icon, label }) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.dropdownItem,
                    background === bg && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onBackgroundChange(bg);
                    closeDropdown();
                  }}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={20}
                    color={background === bg ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      background === bg && styles.dropdownItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* Undo/Redo/Clear */}
        <View style={styles.actionButtons}>
          <IconButton
            icon="undo"
            size={22}
            onPress={onUndo}
            disabled={!canUndo}
            iconColor={canUndo ? colors.textPrimary : colors.textDisabled}
          />
          <IconButton
            icon="redo"
            size={22}
            onPress={onRedo}
            disabled={!canRedo}
            iconColor={canRedo ? colors.textPrimary : colors.textDisabled}
          />
          <IconButton
            icon="delete"
            size={22}
            onPress={onClear}
            iconColor={colors.error}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    bottom: 0,
    height: 1000,
    zIndex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    gap: spacing.xs,
    minWidth: 90,
  },
  dropdownButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  dropdownLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  dropdownMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryLight + '30',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorOption: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  widthPreviewSmall: {
    width: 20,
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
  },
  widthOption: {
    width: 30,
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
});
