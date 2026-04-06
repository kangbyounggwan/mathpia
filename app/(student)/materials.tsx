import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, EmptyState } from '../../src/components/common';
import { colors, spacing, typography } from '../../src/constants/theme';

interface Material {
  id: string;
  title: string;
  subject: string;
  fileType: 'pdf' | 'image';
  uploadDate: string;
  teacherName: string;
}

const mockMaterials: Material[] = [
  {
    id: '1',
    title: '이차방정식 공식 정리',
    subject: '방정식과 부등식',
    fileType: 'pdf',
    uploadDate: '2024-12-20',
    teacherName: '김선생',
  },
  {
    id: '2',
    title: '삼각함수 그래프 모음',
    subject: '수학I - 삼각함수',
    fileType: 'image',
    uploadDate: '2024-12-18',
    teacherName: '김선생',
  },
  {
    id: '3',
    title: '미분 기본 개념',
    subject: '수학II - 미분',
    fileType: 'pdf',
    uploadDate: '2024-12-15',
    teacherName: '김선생',
  },
];

export default function StudentMaterialsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMaterials = mockMaterials.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMaterial = ({ item }: { item: Material }) => (
    <Card
      style={styles.materialCard}
      onPress={() => {
        // TODO: 자료 열람
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={item.fileType === 'pdf' ? 'file-pdf-box' : 'file-image'}
            size={40}
            color={item.fileType === 'pdf' ? colors.error : colors.primary}
          />
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle}>{item.title}</Text>
          <Text style={styles.materialSubject}>{item.subject}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="account" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.teacherName}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.uploadDate}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="download" size={24} color={colors.primary} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="자료 검색"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={{ fontFamily: 'NotoSansKR-Regular' }}
        />
      </View>

      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item.id}
        renderItem={renderMaterial}
        contentContainerStyle={[
          styles.listContent,
          filteredMaterials.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="강의자료가 없습니다"
            description="선생님이 자료를 올리면 여기에 표시됩니다"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  materialCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  materialTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  materialSubject: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  metaDot: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
});
