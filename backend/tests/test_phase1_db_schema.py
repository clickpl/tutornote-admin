#!/usr/bin/env python3
"""
Phase 1 DB 스키마 검증 테스트

테스트 항목:
1. 6개 신규 테이블 존재 확인
2. progress_records 4개 컬럼 추가 확인
3. 샘플 데이터 삽입 테스트
4. INDEX 존재 확인
"""

import os
import sys

# 프로젝트 루트를 sys.path에 추가
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


def get_db_connection():
    """데이터베이스 연결"""
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'tutornote')
        )
    except Exception as e:
        print(f"[DB] Connection failed: {e}")
        return None


def test_tables_exist():
    """테스트 1: 6개 신규 테이블 존재 확인"""
    print("\n" + "=" * 50)
    print("테스트 1: 신규 테이블 존재 확인")
    print("=" * 50)

    required_tables = [
        'activity_logs',
        'report_views',
        'api_usage_logs',
        'operational_costs',
        'system_health_logs',
        'api_health_checks'
    ]

    conn = get_db_connection()
    if not conn:
        print("❌ DB 연결 실패")
        return False

    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    existing_tables = [table[0] for table in cursor.fetchall()]

    all_exist = True
    for table in required_tables:
        if table in existing_tables:
            print(f"  ✅ {table} - 존재")
        else:
            print(f"  ❌ {table} - 없음")
            all_exist = False

    cursor.close()
    conn.close()

    return all_exist


def test_progress_records_columns():
    """테스트 2: progress_records 테이블 4개 컬럼 추가 확인"""
    print("\n" + "=" * 50)
    print("테스트 2: progress_records 컬럼 추가 확인")
    print("=" * 50)

    required_columns = [
        'ai_generated',
        'generation_time_seconds',
        'edit_count',
        'card_news_generated'
    ]

    conn = get_db_connection()
    if not conn:
        print("❌ DB 연결 실패")
        return False

    cursor = conn.cursor()
    cursor.execute("DESCRIBE progress_records")
    existing_columns = [col[0] for col in cursor.fetchall()]

    all_exist = True
    for col in required_columns:
        if col in existing_columns:
            print(f"  ✅ {col} - 존재")
        else:
            print(f"  ❌ {col} - 없음")
            all_exist = False

    cursor.close()
    conn.close()

    return all_exist


def test_table_structure():
    """테스트 3: 각 테이블 구조 확인"""
    print("\n" + "=" * 50)
    print("테스트 3: 테이블 구조 확인")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("❌ DB 연결 실패")
        return False

    cursor = conn.cursor()

    tables_to_check = [
        ('activity_logs', ['id', 'academy_id', 'action_type', 'action_detail', 'created_at']),
        ('report_views', ['id', 'report_id', 'share_token', 'viewer_type', 'created_at']),
        ('api_usage_logs', ['id', 'api_name', 'academy_id', 'request_tokens', 'response_tokens', 'total_cost']),
        ('system_health_logs', ['id', 'cpu_usage', 'ram_usage', 'disk_usage', 'created_at']),
    ]

    all_valid = True
    for table_name, required_cols in tables_to_check:
        try:
            cursor.execute(f"DESCRIBE {table_name}")
            existing_cols = [col[0] for col in cursor.fetchall()]

            missing = [col for col in required_cols if col not in existing_cols]
            if missing:
                print(f"  ⚠️  {table_name}: 누락된 컬럼 - {missing}")
                all_valid = False
            else:
                print(f"  ✅ {table_name}: 필수 컬럼 모두 존재")
        except Exception as e:
            print(f"  ❌ {table_name}: 조회 실패 - {e}")
            all_valid = False

    cursor.close()
    conn.close()

    return all_valid


def test_insert_sample_data():
    """테스트 4: 샘플 데이터 삽입 테스트"""
    print("\n" + "=" * 50)
    print("테스트 4: 샘플 데이터 삽입 테스트")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("❌ DB 연결 실패")
        return False

    cursor = conn.cursor()
    all_success = True

    test_queries = [
        ("system_health_logs", """
            INSERT INTO system_health_logs (cpu_usage, ram_usage, disk_usage, active_connections)
            VALUES (45.2, 60.1, 75.8, 10)
        """),
        ("api_usage_logs", """
            INSERT INTO api_usage_logs (api_name, academy_id, endpoint, request_tokens, response_tokens, total_cost, response_time_ms, status)
            VALUES ('claude', NULL, '/test', 100, 200, 0.0033, 500, 'success')
        """),
        ("api_health_checks", """
            INSERT INTO api_health_checks (api_name, status, response_time_ms)
            VALUES ('claude', 'success', 120)
        """),
    ]

    for table_name, query in test_queries:
        try:
            cursor.execute(query)
            conn.commit()
            print(f"  ✅ {table_name}: 삽입 성공")
        except Exception as e:
            print(f"  ❌ {table_name}: 삽입 실패 - {e}")
            all_success = False
            conn.rollback()

    # 삽입된 데이터 확인
    print("\n  [삽입 확인]")
    for table_name, _ in test_queries:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"    {table_name}: {count}건")
        except Exception as e:
            print(f"    {table_name}: 조회 실패 - {e}")

    cursor.close()
    conn.close()

    return all_success


def test_indexes():
    """테스트 5: INDEX 존재 확인"""
    print("\n" + "=" * 50)
    print("테스트 5: INDEX 존재 확인")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("❌ DB 연결 실패")
        return False

    cursor = conn.cursor()

    tables_to_check = ['activity_logs', 'api_usage_logs', 'system_health_logs']

    for table in tables_to_check:
        try:
            cursor.execute(f"SHOW INDEX FROM {table}")
            indexes = cursor.fetchall()
            index_names = set([idx[2] for idx in indexes])  # Key_name is at index 2
            print(f"  {table}: {len(index_names)}개 인덱스 - {list(index_names)[:5]}")
        except Exception as e:
            print(f"  ❌ {table}: 인덱스 조회 실패 - {e}")

    cursor.close()
    conn.close()

    return True


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("  Phase 1 DB 스키마 검증 테스트")
    print("=" * 60)

    results = {
        'tables_exist': test_tables_exist(),
        'progress_records_columns': test_progress_records_columns(),
        'table_structure': test_table_structure(),
        'insert_sample_data': test_insert_sample_data(),
        'indexes': test_indexes(),
    }

    print("\n" + "=" * 60)
    print("  테스트 결과 요약")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("  🎉 모든 DB 스키마 테스트 통과!")
    else:
        print("  ⚠️  일부 테스트 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
