import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '../../src/components/common';
import { colors, spacing } from '../../src/constants/theme';
import PdfUploadModal from '../../src/components/teacher/PdfUploadModal';
import { ExtractedProblem } from '../../src/services/geminiService';

interface Material {
  id: string;
  title: string;
  grade: string;
  subject: string;
  fileType: 'pdf' | 'image';
  fileSize: string;
  uploadDate: string;
  viewCount: number;
}

const mockMaterials: Material[] = [
  {
    id: '1',
    title: '이차방정식 공식 정리',
    grade: '고1',
    subject: '방정식과 부등식',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    uploadDate: '2024-12-20',
    viewCount: 45,
  },
  {
    id: '2',
    title: '삼각함수 그래프 모음',
    grade: '고2',
    subject: '수학I - 삼각함수',
    fileType: 'image',
    fileSize: '5.1 MB',
    uploadDate: '2024-12-18',
    viewCount: 32,
  },
  {
    id: '3',
    title: '미분 기본 개념',
    grade: '고2',
    subject: '수학II - 미분',
    fileType: 'pdf',
    fileSize: '3.8 MB',
    uploadDate: '2024-12-15',
    viewCount: 28,
  },
  {
    id: '4',
    title: '확률 문제 풀이 전략',
    grade: '고3',
    subject: '확률과 통계',
    fileType: 'pdf',
    fileSize: '4.2 MB',
    uploadDate: '2024-12-10',
    viewCount: 56,
  },
];

export default function MaterialsScreen() {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [fabOpen, setFabOpen] = useState(false);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);

  const grades = ['all', '중1', '중2', '중3', '고1', '고2', '고3'];

  const handleExtractComplete = (problems: ExtractedProblem[]) => {
    setPdfModalVisible(false);
    router.push({
      pathname: '/(teacher)/problem-extract',
      params: { problems: JSON.stringify(problems) },
    });
  };

  const filteredMaterials = mockMaterials.filter(
    (m) => selectedGrade === 'all' || m.grade === selectedGrade
  );

  const renderMaterial = ({ item }: { item: Material }) => (
    <Card style={styles.materialCard}>
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
          <View style={styles.tags}>
            <Chip compact style={styles.gradeChip}>{item.grade}</Chip>
            <Text style={styles.subject}>{item.subject}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{item.fileSize}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.uploadDate}</Text>
            <Text style={styles.metaDot}>•</Text>
            <MaterialCommunityIcons name="eye" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.viewCount}</Text>
          </View>
        </View>
        <IconButton icon="dots-vertical" size={24} onPress={() => {}} accessibilityLabel="더보기 메뉴" />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={grades}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedGrade === item}
              onPress={() => setSelectedGrade(item)}
              style={styles.filterChip}
              showSelectedCheck={false}
            >
              {item === 'all' ? '전체' : item}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item.id}
        renderItem={renderMaterial}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'upload',
            label: '자료 업로드',
            onPress: () => {},
          },
          {
            icon: 'file-document-edit',
            label: 'PDF 문제 추출',
            onPress: () => {
              setPdfModalVisible(true);
              setFabOpen(false);
            },
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        style={styles.fabGroup}
        fabStyle={styles.fab}
      />

      <PdfUploadModal
        visible={pdfModalVisible}
        onDismiss={() => setPdfModalVisible(false)}
        onExtractComplete={handleExtractComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    minHeight: 44,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gradeChip: {
    backgroundColor: colors.primaryLight,
    marginRight: spacing.sm,
  },
  subject: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  metaDot: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  fabGroup: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fab: {
    backgroundColor: colors.primary,
  },
});
