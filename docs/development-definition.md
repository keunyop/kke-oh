# KKE-OH �������Ǽ�

## 1. ���� ����

�� ������ `requirements-definition.md`�� ���� ��ǥ ���� ������ ������ ������.  
���� �ڵ��� ������ �ƴ϶�, ������ �����Ǿ�� �� ���� ��Ű��ó�� ���� ��Ģ�� �����Ѵ�.

- ������: 2026-03-17
- ��� ����: Next.js 14 App Router, React 18, TypeScript, Zod, Supabase, Cloudflare R2, JSZip, Sharp
- ���� ���� ����: Google ���� �� ���� ������ child-directed treatment, personalized ads ����, GPT rewarded ads ������ �ݿ��Ѵ�

## 2. ��ǥ �ý��� ����

### 2.1 ��ǰ ����

- �Ƶ� ģȭ���� HTML ���� ���ε�/����/�÷��� �÷���
- �ʾ� �߽��� ����-�׽�Ʈ-�Խ� ��ũ�÷ο츦 ���� ����
- ���ε� ���Ӱ� AI ���� ������ ������ ����/� ü�� �ȿ��� �����ϴ� �÷���
- Google ����, ������ ����, ����Ʈ ����, AI ��뷮 ��� ������ ��� ����

### 2.2 �ٽ� ��Ű��ó ��Ģ

- App Router ��� ������ + Route Handler API ������ �����Ѵ�.
- ����Ҵ� `Supabase + R2` ���� � ������ �����Ѵ�.
- ���� ���� ��å�� ������ �˼� ��å�� �и��Ѵ�.
- �Ű� ������ �ڵ� ������ �ƴ϶� ������ alert ��ȣ�� ����Ѵ�.
- ��������� AI ���� ������ �ƴ϶� ��� ������ ����� �� �ִ� ���� ������� �����Ѵ�.
- ����Ʈ�� ���� ���� ������� �����ϰ�, AI ��� �� ���� ������ �����Ѵ�.
- ����� child-directed ó���� ����ȭ ��Ģ�� ������ �����Ѵ�.
- ���ε�, ����, ������ ��å�� ���� �ʴ� ���Ž� �ڵ�� �����Ѵ�.
- �ۼ��ڿ� ����� �����ڿ� ������ ���� `is_hidden` ���¸� �����ϴ��� ���ΰ� UX�� ������ �ٷ�� �Ѵ�.

### 2.3 UI/UX ���� ��Ģ

- ����� �ֿ� CTA �켱������ �������� ������ ������ �����ϰ�, �˻�â�� ���� ��ҵǸ� CTA�� �ٹٲ޵��� �ʰ� �����Ѵ�.
- Ȩ ��������� ����Ʈ ��ü ��� ��︮�� ���� �ñ״�ó �������� ����ϵ�, ������� ������ chalk ��Ÿ�� ����Ʈ�� ���������� ����Ѵ�.
- ���� ī���� �� �ؽ�Ʈ�� ���� ������ ��Ģ�� tooltip ��Ģ���� ó���Ѵ�.
- �α���, ������, ����Ʈ, �� ���� ȭ���� ���� �е��� ���̵� ���� ������ �ٿ� ������ ��� ȭ������ �����.
- ���� ȭ��� ���� ȭ���� AI UX�� ��ü, ���� ����, ��� �ȳ� ü�踦 �����ϰ� �����.
- ���� ȭ��� ���� ȭ���� AI �� �⺻ ������ Smart Buddy�� �����Ѵ�.

## 3. �ٽ� ������

### 3.1 ���� ������

- ���� ���ε�/����/����
- ���� ���/��/��������
- ����/�ǵ��/�Ű�
- ������ �˼�

### 3.2 Ȯ�� ������

- AI �� īŻ�α�
- ����Ʈ �ܾ� �� �ŷ� ����
- ����Ʈ ���� ��ǰ �� �ֹ�
- ������ ���� ���� �� ���� ����
- Google ���� ���� �
- AI ����/���� ��뷮 �� ��� ��å
- Ȩ Ž�� ��ȣ�ۿ�� �巡�� ������ è�Ǿ� ��Ʈ��
- �ٱ��� ���� ������ ȭ�麰 tooltip ��Ģ

## 4. ���͸� �� ��� ����

### 4.1 ���� ��� �ֿ� ���

- `app/`
  - �������� API ���Ʈ
- `components/`
  - ���� UI �� ���� ȭ�� ������Ʈ
- `lib/auth/`
  - ���� �����, ����, ��й�ȣ �ؽ�
- `lib/games/`
  - ���� ������ ����
- `lib/security/`
  - ������ ����, CSP, IP ó��
- `lib/db/`
  - Supabase Ŭ���̾�Ʈ
- `lib/r2/`
  - R2 ���ε�/��ȸ
- `supabase/migrations/`
  - DB ��Ű�� �̷�
- `public/`
  - KKE-OH �ΰ� �� �⺻ �ð� �ڻ�

### 4.2 �߰� ������ �ʿ��� ���

- `components/site/`
  - ��� �˻�, Ȩ è�Ǿ� ��Ʈ��, ���� ī�� ������ ��Ģ ����
- `components/game/`
  - ���� �� �׼� tooltip, �������� �巡�� ó��, ���� ���� ����
- `components/ui/`
  - ���� tooltip, danger button, truncate-with-tooltip ������ �� �� �ִ� ���̾� ����
- `components/points/`
  - �ܾ� ǥ��, ����Ʈ ���� UI, �ŷ����� UI
- `components/ads/`
  - ���/�ǵ� ���� ����, ������ ���� ���� UI
- `lib/ai/`
  - AI �� īŻ�α�, ��� ���, �ʵ��л� ������ ���� metadata, ǥ�� system/user prompt builder
- `lib/points/`
  - �ܾ� ��ȸ, �ŷ� ����, ����/���� ����
- `lib/ads/`
  - Google ���� ���� ����, ������ ���� ���� ����, ���� ����
- `lib/i18n/` �Ǵ� ���� `lib/i18n.ts`
  - ���� ����, tooltip ��, ������/����Ʈ/���� ���� copy ����

### 4.3 ���� ��� ���/���

- filesystem ���� provider �� fallback �ڵ�
- �̻�� ������ API
- �ߺ��� AI ���� ����
- ������� �ʴ� ����/���� ����
- ���ڵ��� ���� ���ڿ��� ���Ե� UI ����
- ���������� ���� ������ ������ cost card / danger button / status badge ����

## 5. ����/���� ����

### 5.1 ȯ�溯��

�ٽ� ȯ�溯���� ������ ����.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `OPENAI_API_KEY`
- `OPENAI_GAME_MODEL`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_SLOT_*`
- `POINT_PACKAGE_*` �Ǵ� ����Ʈ ��ǰ ���� ���̺�

### 5.2 � ��Ģ

- `GAME_DATA_DRIVER`, `GAME_STORAGE_DIR`, `AUTH_STORAGE_DIR`, `GAME_METRICS_DIR`ó�� filesystem ��ȯ�� ���� ������ � ���ؿ��� ���� ����̴�.
- ���� ��Ÿ�����ʹ� Supabase `games` ���̺��� �������� �����Ѵ�.
- ���� �ڻ��� R2�� �����ϰ�, �ۿ����� �ڻ� API�� ���� ������ �߰��Ѵ�.
- ���� ������ ����Ʈ ��å�� ȯ�溯���� DB ������ ȥ���� �� ������, ����� ����/���� ��å�� DB ������ �켱�̴�.

## 6. ������ ��

### 6.1 ���� ������ ��

�ٽ� ���� ���� ���� �Ӽ��� �����Ѵ�.

- `id`
- `slug`
- `title`
- `description`
- `uploader_user_id`
- `uploader_name`
- `status`: `DRAFT | PUBLIC | REMOVED`
- `is_hidden`
- `hidden_reason`
- `storage_prefix`
- `report_count`
- `allowlist_violation`
- `leaderboard_enabled`
- `like_count`
- `dislike_count`
- `plays_7d`
- `plays_30d`
- `entry_path`
- `thumbnail_path`
- `created_at`
- `updated_at`

### 6.2 Ȯ�� ����Ʈ/����/AI �� ������ ��

�ʼ� �ű� �Ǵ� Ȯ�� ����Ƽ:

- `ai_models`
  - `id`
  - `label`
  - `provider`
  - `model_name`
  - `point_cost_create`
  - `point_cost_edit`
  - `kid_description`
  - `active`
  - `sort_order`
- `user_point_balances`
  - `user_id`
  - `balance`
  - `updated_at`
- `user_point_ledger`
  - `id`
  - `user_id`
  - `type`
  - `delta`
  - `balance_after`
  - `source_type`
  - `source_id`
  - `metadata`
  - `created_at`
- `point_packages`
  - `id`
  - `name`
  - `points`
  - `price`
  - `active`
- `point_purchase_orders`
  - `id`
  - `user_id`
  - `package_id`
  - `status`
  - `payment_provider`
  - `provider_order_id`
  - `created_at`
  - `updated_at`
- `rewarded_ad_events`
  - `id`
  - `user_id`
  - `game_id`
  - `status`
  - `reward_points`
  - `ad_provider`
  - `provider_event_id`
  - `created_at`

### 6.3 �ٽ� ��å �ʵ�

- `report_count`
  - ������ alert ���ذ� ������ ���
  - ���� ���� ���� �������� ���� ������� ����
- `leaderboard_enabled`
  - AI ����/���� ���ε� ���� ��� ��� �����ؾ� ��
- `thumbnail_path`
  - ����� ���ε�, AI ����, ZIP ���� �ĺ�, KKE-OH �ΰ� ��� �⺻ �÷��̽�Ȧ�� �� �ϳ��� ����
- `is_hidden`
  - ������ �˼� ����� �ۼ��� ���� ���� ��� ǥ���� �� �־�� ��
- `hidden_reason`
  - `Hidden by admin`, `Hidden by owner`, `Removed by admin`, `Removed by owner`ó�� ������ ������ �� �־�� ��
- `user_point_ledger`
  - ����Ʈ ����/������ ���� ���� ����
- `ai_models`
  - �� ���� UI, ��� ���, ��� ģȭ ������ ����

### 6.4 Supabase ��Ű�� ����

���� ��� �ٽ� ���̺�:

- `games`
- `game_reports`
- `game_feedback`
- `app_users`
- `app_sessions`
- `game_leaderboard_entries`

�ű� �߰� �Ǵ� Ȯ�� ��� ���̺�:

- `ai_models`
- `user_point_balances`
- `user_point_ledger`
- `point_packages`
- `point_purchase_orders`
- `rewarded_ad_events`

����� ��� ���̺�:

- `upload_events`
- `blocklist`

## 7. ����� ����

### 7.1 ���� �����

`lib/games/repository.ts`�� Supabase ��� ���� ����� �߻�ȭ�� �����Ѵ�.

�ʿ� ���:

- ���� ���� ��� ��ȸ
- �����ڿ� ��� ��ȸ
- �ۼ��ں� ��� ��ȸ
- �ܰ� ��ȸ(`id`, `slug`)
- �÷��� �� ����
- ���� ����
- �ǵ�� ����
- �Ű� ����
- �Խ�
- �ۼ��� ���� / �ٽ� ����
- ������ ���� / ����
- ����

### 7.2 ���� �����

���� ����Ҵ� Supabase ������� ����ȭ�Ѵ�.

�ʿ� ���:

- �α��� ID ��ȸ
- ȸ�� ����
- ���� ����
- ���� ��ū���� ����� ��ȸ
- ���� ����
- locale ��� ���� �޽��� ���� �Ǵ� ���� code ��ȯ

### 7.3 ����Ʈ �����

�ű� `PointRepository` �Ǵ� ���� ���񽺰� �ʿ��ϴ�.

�ʿ� ���:

- �ܾ� ��ȸ
- ����Ʈ ����
- ����Ʈ ����
- ���� ��� ����
- �ֹ� ���� �� ����Ʈ ����
- ������ ���� ���� �� ����Ʈ ����
- �ߺ� ���� ����

### 7.4 ���� ��Ģ

- filesystem provider�� � ������ ���� �����Ƿ� ���� ����̴�.
- fallback�� ������ ��Ȯ�� � ������ ���ٸ� reactions/leaderboard/auth filesystem fallback�� �Բ� �����Ѵ�.

## 8. ������ ����

### 8.1 ����� ������

- `/`
  - ��� �˻�
  - ���� ���� ���
  - �Է� ��� ���͸�
  - ��� è�Ǿ� �������� ��Ʈ��
  - �ڵ� �̵� + drag/touch �̵�
  - ī�� click/tap ���� ���� �� �̵�
  - ���� ����
- `/login`
  - ��� ���ĵ� �α��� / ȸ������ ī��
  - ���ʿ��� ���� ī�� ����
- `/submit`
  - AI ����
  - HTML ���ε�
  - ZIP ���ε�
  - `How it works`
  - AI �� ����
  - ����Ʈ ��� �ȳ�
  - ���� ��� ����
- `/game/[id]`
  - ���� �÷���
  - ����/���� ī��
  - �� �Ʒ��� compact ��������
  - ���Ӻ� ��Ÿ������/���� �����
  - ���ƿ�/�Ⱦ��
  - �ǵ��
  - �Ű�
  - tooltip
  - ������ ���� ���� UI
- `/my-games`
  - �� ���� ���
  - �Խ�
  - �Խ� ����
  - ����
- `/my-games/[id]/edit`
  - ���� ����
  - ��� ��Ÿ������ �Է�
  - AI ���� �����Ȳ UI
  - �Ϸ� ī��� ���� �׼� �ȳ�
  - AI �� ����
  - ���� ��� ����
- `/points`
  - ����Ʈ �ܾ�
  - �ŷ�����
  - 3�� ���� ī��
- `/admin`
  - ������ ��ü ���� ���� ��ú���
  - ����� ���� ���
  - �Ű� alert �켱 ���� ����
### 8.2 ���� ȭ�� ��Ģ

- ���� ī�� ����� �ۼ��ڸ��� 1�� ������ ó���Ѵ�.
- ������ ó���� �ؽ�Ʈ�� ������ �׼��� tooltip���� ���� �Ǵ� ��ɸ��� �����Ѵ�.
- danger action�� ������/�� ���� ȭ�鿡�� ���� ������ �迭 ��Ÿ���� �����Ѵ�.

## 9. API ���� ����

### 9.1 ����/����

| ��� | �޼��� | ���� |
| --- | --- | --- |
| `/api/auth/login` | `POST` | �α��� �� ���� ��Ű �߱� |
| `/api/auth/signup` | `POST` | ȸ������ �� ���� ��Ű �߱� |
| `/api/auth/logout` | `POST` | �α׾ƿ� �� ���� ��Ű ���� |
| `/api/locale` | `POST` | ��� ��Ű ���� |

��Ģ:

- ���� API�� locale cookie �Ǵ� ��û ���ؽ�Ʈ�� �´� ���� code / ����ȭ �޽����� ��ȯ�ؾ� �Ѵ�.
- �ߺ� ID, ��й�ȣ ���� ���� ���� Ŭ���̾�Ʈ�� ���� ���� ��Ÿ�Ϸ� �״�� ǥ���� �� �ִ� �������� ���� ������ �����ؾ� �Ѵ�.

### 9.2 ���ε�/����/����

| ��� | �޼��� | ���� |
| --- | --- | --- |
| `/api/upload/title-check` | `GET` | slug ��� ���� ���� Ȯ�� |
| `/api/upload/zip-inspect` | `POST` | ZIP �˻� �� �ӽ� ���� ���� |
| `/api/upload/paste` | `POST` | HTML ���� ���ε� ���� |
| `/api/upload/confirm` | `POST` | ZIP �˻� ��� Ȯ�� ���� |
| `/api/upload/generate-v2` | `POST` | ǥ�� AI ���� API |
| `/api/my-games/[id]` | `POST` | �ۼ��ڿ� �Խ�/����/���� ���� ���� |
| `/api/my-games/[id]/edit` | `POST` | ���� ���� API |
| `/api/ai/models` | `GET` | AI �� ���/���/���� ��ȸ |

��Ģ:

- AI ���� API�� �ϳ��� �����Ѵ�.
- HTML ���ε�� ���� ���ε常 �޴´�.
- ���� ���ε��� ������ ���� �Է����� ó���Ѵ�.
- ZIP ���ε忡���� ���� �ܺ� ����� ������ �䱸���� �ʴ´�.
- ���� ���ε�� ���� �帧 ��� `leaderboard_enabled`�� ��������� �ٷ��.
- AI ����/���� ��û�� `modelId`�� �޾� ����Ʈ ������ ������ �����Ѵ�.
- AI ����/���� UI�� ��� �� ����, ���� ����Ʈ, ���� ����, ���� ���θ� ���� �������� �޴´�.

### 9.3 ���� �÷���/����

| ��� | �޼��� | ���� |
| --- | --- | --- |
| `/api/games/[id]/assets/[...assetPath]` | `GET` | ���� �ڻ� ���� |
| `/api/games/[id]/play` | `POST` | �÷��� �� ���� �� �÷��� ����Ʈ ���� ���� |
| `/api/games/[id]/reaction` | `POST` | ���ƿ�/�Ⱦ�� ���� |
| `/api/games/[id]/feedback` | `POST` | �ǵ�� ���� |
| `/api/games/[id]/report` | `POST` | �Ű� ���� |
| `/api/games/[id]/leaderboard` | `POST` | �������� ���� ���� |
| `/api/ads/rewarded/session` | `POST` | ������ ���� ��û ���� ���� |
| `/api/ads/rewarded/grant` | `POST` | ������ ���� �� ����Ʈ ���� |

��å:

- �Ű�� �����ϵ� �ڵ� ������ �������� �ʴ´�.
- �÷��� �� ������ IP �������� �ƴ϶� �ؽ� ��� ���� ����Ѵ�.
- ������ ����Ʈ�� ���� �Ϸ� �̺�Ʈ�� ���ε� �Ŀ��� �����Ѵ�.

### 9.4 ����Ʈ/����

| ��� | �޼��� | ���� |
| --- | --- | --- |
| `/api/points/balance` | `GET` | ���� �ܾ� ��ȸ |
| `/api/points/ledger` | `GET` | �ŷ����� ��ȸ |
| `/api/points/packages` | `GET` | ���� ��ǰ ��ȸ |
| `/api/points/purchase` | `POST` | ����Ʈ ���� �ֹ� ���� |
| `/api/points/purchase/confirm` | `POST` | ���� ���� �� ����Ʈ ���� |

### 9.5 ������

| ��� | �޼��� | ���� |
| --- | --- | --- |
| `/api/admin/games` | `GET` | �����ڿ� ���� ��� |
| `/api/admin/games/[id]/hide` | `POST` | ���� ���� |
| `/api/admin/games/[id]/unhide` | `POST` | ���� ���� |
| `/api/admin/games/[id]/delete` | `POST` | ���� ���� ó�� |

��Ģ:

- ��Ȱ�� ������ API�� �������� �ʴ´�.
- �Ű� alert ���¸� �����̳� ���� ���ؿ��� �켱 ����� �� �־�� �Ѵ�.

## 10. �ٽ� ���� �帧

### 10.1 Ȩ Ž�� �帧

1. ���� ���Ӱ� è�Ǿ� �����͸� ��ȸ�Ѵ�.
2. è�Ǿ� ��Ʈ���� ���� ��ܿ� ���� ��ġ�Ѵ�.
3. �˻� �Է°����� ����/�ۼ��� ���� Ŭ���̾�Ʈ ���͸��� �����Ѵ�.
4. è�Ǿ� ��Ʈ���� �ڵ� �̵��� �����Ѵ�.
5. ����ڰ� ���콺 �Ǵ� �հ������� drag �ϸ� ���� �̵��� �켱�Ѵ�.
6. drag ���� �� �ڵ� �̵��� �ٽ� �ڿ������� �簳�Ѵ�.
7. ����� ��ġ ȯ�濡���� �հ��� ���������� �¿� �̵��� ������ �����ؾ� �Ѵ�.

### 10.2 AI ���� �帧

1. �α��� Ȯ��
2. AI �� ���, �ʵ��л��� ����, ���, �ܾ� ��ȸ
3. �� ���ð� ����Ʈ �ܾ� Ȯ��
4. ���� �� ���� �Ǵ� ����Ʈ ���� ����
5. ������Ʈ ����
6. �ʿ� �� ���� ��� ������ ���� ��Ÿ������ �Է�
7. ǥ�� �ý��� ������Ʈ�� ǥ�� ����� ������Ʈ�� ����
8. OpenAI Responses API ȣ��
9. ������ HTML�� ���� ���� ���� ���� �Ծ��� �����ϴ��� �����ϰ� �ʿ� �� ����
10. ��Ÿ�� ����ũ �׽�Ʈ�� ���� ����/����/�⺻ ��ȣ�ۿ� ���� ���θ� �����ϰ� ���� �� ��õ�
11. HTML�� KKE-OH �������� �긮�� ����
12. ����� SVG ����ȭ �Ǵ� �⺻ ����� ����
13. ����Ʈ ���� ���� ���
14. �ʾ� ����
15. �������� Ȱ��ȭ
16. �����Ȳ UI�� �Ϸ� ���� ����

### 10.3 AI ���� �帧

1. �α��� Ȯ��
2. ���� ��� ������ Ȯ��
3. AI �� ���, ����, ���, �ܾ� ��ȸ
4. �� ���ð� ����Ʈ �ܾ� Ȯ��
5. ���� �� ���� �Ǵ� ����Ʈ ���� ����
6. ��� ��Ÿ������ �Է� Ȯ��
7. �ʿ� �� ���� ��� ���� �Է� Ȯ��
8. ���� ���� ����/HTML �Ϻο� ǥ�� ����� ������Ʈ�� �Բ� ����
9. OpenAI ȣ��
10. ���� ����� ���� ���� ���� ���� �Ծ��� �����ϴ��� �����ϰ� �ʿ� �� ����
11. ��Ÿ�� ����ũ �׽�Ʈ�� ���� ����/����/�⺻ ��ȣ�ۿ� ���� ���θ� �����ϰ� ���� �� ��õ�
12. ����Ʈ ���� ���� ���
13. ���� ��� ����
14. AI ������ ������ ������ �����Ȳ UI ǥ�ÿ� �Ϸ� ī��/�Ϸ� �޽��� ǥ��

### 10.4 ���� ���� �÷��̿� ������ ���� �帧

1. ���� ���� �÷��� ����
2. �÷��� �� ���� �õ� �� ����Ʈ ���� ���� �Ǵ�
3. ���� ����/Ŭ���� �� ������ ���� ���� UI ����
4. ����ڰ� opt-in �� ���� ���� ��û
5. ���� ȯ���̸� Google rewarded flow ����
6. ���� ���� �̺�Ʈ ���� �� ����Ʈ ����
7. ����/������ �� ��ü �ȳ� ǥ��

### 10.5 �ۼ��� ����/���� �帧

1. �ʾ� ������ `Publish`�� ���� ��ȯ�Ѵ�.
2. �̹� ������ ������ `Hide from Publish`�� ���� ��ȯ�Ѵ�.
3. ���� ������ �ٽ� ������ �� �־�� �Ѵ�.
4. �� �帧�� �ʾ� ȸ�Ϳ� ���еǸ�, ���� ���� ���� ��ϰ� URL�� �����Ѵ�.

### 10.6 ����Ʈ ���� �帧

1. ����ڰ� ����Ʈ ��ǰ ����
2. �ֹ� ����
3. ���� ���� ���
4. ���� �Ϸ� �� ����Ʈ ����
5. ���� ��� ����
6. �ܾ� ��� �ݿ�

### 10.7 AI ���� ���� ������Ʈ ����

������Ʈ�� ������ �������� ���� ���� ����� �����ؾ� �Ѵ�.  
������ JSON schema�� ���δ� ������ ������ ���� ���� ���⹰ ����� `html` �ʵ� ���� ���� raw HTML ���� �������� �����Ѵ�.

�ý��� ������Ʈ ���ؾ�:

```text
You are an expert HTML5 game developer specializing in small, highly engaging browser games.

Your job is to generate COMPLETE, PLAYABLE, and BUG-FREE games.

��������������������������������������
# CORE RULES
��������������������������������������
- Always generate a FULLY WORKING game (never partial or placeholder code)
- The game must run immediately when opened in a browser
- Do NOT omit any required logic (game loop, collision, restart, etc.)
- Do NOT include explanations, comments, or markdown outside the code
- Output ONLY a single HTML file

��������������������������������������
# TECHNICAL CONSTRAINTS
��������������������������������������
- Single file only (HTML + CSS + JS combined)
- Use vanilla JavaScript only (no frameworks, no external libraries)
- No external assets (no CDN, no external images, no fonts)
- All assets must be generated in code (canvas, shapes, etc.)
- Must run offline

��������������������������������������
# REQUIRED GAME STRUCTURE
��������������������������������������
Every game MUST include:

1. Start Screen
   - Title
   - Start button

2. Game Loop
   - update()
   - render()
   - requestAnimationFrame

3. Player Controls
   - Keyboard input (or clearly defined alternative)

4. Core Mechanics
   - Movement
   - Collision detection
   - Score tracking

5. Difficulty Scaling
   - Game becomes harder over time

6. Game Over State
   - Clear fail condition
   - Final score display

7. Restart System
   - Restart button
   - Fully reset game state

��������������������������������������
# LEADERBOARD INTEGRATION (MANDATORY)
��������������������������������������
- If window.kkeohSubmitScore exists, call window.kkeohSubmitScore(finalScore) whenever a run ends
- A run ending includes game over, defeat, victory, stage clear, timeout, or any other terminal resolution
- Call window.kkeohSubmitScore(finalScore) immediately before any restart, reset, or new-game action that clears the final score
- The submitted score must exactly match the final score shown to the player
- Never submit blank, placeholder, negative, or non-numeric scores

��������������������������������������
# GAME DESIGN PRINCIPLES
��������������������������������������
- Simple to learn within 5 seconds
- Clear objective and feedback
- Immediate response to user input
- Increasing challenge over time
- Avoid unnecessary complexity
- Prioritize smooth gameplay over visual polish

��������������������������������������
# QUALITY CONTROL (MANDATORY)
��������������������������������������
Before finalizing output, internally verify:
- No syntax errors
- Game runs without crashing
- Restart works correctly
- Score updates correctly
- Difficulty actually increases
- Player can lose (fail condition exists)
- Leaderboard submission happens on every terminal state and before score-clearing restart/reset

If any of the above is not satisfied, FIX IT before returning.

��������������������������������������
# OUTPUT FORMAT (STRICT)
��������������������������������������
- Return ONLY raw HTML code
- No markdown (no ```), no explanations, no extra text
```

����� ������Ʈ ���ؾ�:

```text
Create a complete playable HTML5 game based on the following specifications.

��������������������������������������
# GAME SPEC
��������������������������������������
Genre: {genre}
Theme: {theme}

Core Mechanic:
{core_mechanic}

Objective:
{objective}

Player Actions:
{player_actions}

Difficulty Level:
{difficulty}

Session Length:
{session_length}

��������������������������������������
# GAME RULES
��������������������������������������
Win Condition:
{win_condition}

Lose Condition:
{lose_condition}

Difficulty Scaling:
{difficulty_scaling}

��������������������������������������
# LEADERBOARD
��������������������������������������
- This game runs inside KKE-OH and may expose window.kkeohSubmitScore(score)
- When the player loses, wins, clears the stage, times out, or otherwise finishes a run, call window.kkeohSubmitScore(finalScore) if available
- Immediately before any restart, reset, or new-game action that would clear the final score, call window.kkeohSubmitScore(finalScore) if available
- The submitted score must be the same numeric final score shown on screen

��������������������������������������
# UI REQUIREMENTS
��������������������������������������
- Show score on screen
- Display clear start screen
- Display game over screen
- Include restart button

��������������������������������������
# EXTRA (OPTIONAL)
��������������������������������������
{extra_features}

��������������������������������������
# OUTPUT
��������������������������������������
Return ONLY a single HTML file.
```

ġȯ ��Ģ:

- �� ���ð��� ������Ʈ���� �ʵ带 �������� ���� �ڿ��� �⺻������ �����Ѵ�.
- `extra_features`�� ��� ������ `None`���� �����Ѵ�.
- AI ���������� ���� ���� ����, �����ؾ� �� ����, ���ľ� �� ������ ����� ������Ʈ �ڿ� �߰� �ο� �������� ���δ�.
- ����/���� ��� �������� ������ �ɼ��� �ƴ϶� �⺻ ���� �׸����� ����Ѵ�.
- ����/���� ��� �� ���� HTML�� ���� ���� ��Ÿ�� ����ũ �׽�Ʈ�� ����ؾ� �Ѵ�.

## 11. �ֿ� ������ ����

### 11.1 slug ó��

- slug�� NFKC ����ȭ �� �ҹ���ȭ
- ����/���� �� ���ڴ� ���������� ġȯ
- �ִ� ���� 64��
- ���� ���� ���Խ�: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- �ߺ� �� suffix(`-2`, `-3`...)�� �ٿ� ����ũ ����

### 11.2 ZIP �˻�

- ��� Ȯ���� ��� ��� ����
- ��� ��� Ż�� ����
- `game.json`�� ����
- HTML ���, ����� �ĺ�, allowlist ���� ���θ� �Բ� ����
- ZIP ���ε忡���� �ܺ� ����� �Է� ��� ZIP ���� �ĺ��� �⺻ ����� ��å�� ����Ѵ�.

### 11.3 �⺻ ����� ó��

- �⺻ �÷��̽�Ȧ���� KKE-OH �ΰ� ������� ����
- ����� ���� ������� ������ �켱 ���
- ZIP ���ε忡���� ���� �ܺ� ����� ���� ZIP ���� �ĺ� ��� ���θ� �����Ѵ�.
- ������� ���ε� �� WEBP�� ����ȭ

### 11.4 �Ű� ó��

�Ű� ó�� ��Ģ:

- �Ű� ������ ����
- `report_count`�� ����
- 2ȸ �̻��̸� ������ alert ���·� ǥ��
- �ڵ� ������ ���� ����

### 11.5 �������� ����

�������� ���� ���� �Ծ�:

- ���� ���� ���� �Լ�: `window.kkeohSubmitScore(score)`
- ����/���� ������Ʈ�� ���� ����, �¸�, �й�, Ŭ����, Ÿ�Ӿƿ�, ��Ÿ ���� ���¸��� �� �Լ��� ȣ���ϵ��� �䱸�ؾ� �Ѵ�.
- ����/���� ������Ʈ�� �����, ����, �� ���� ���� ����ó�� ������ �������� �������� ������ ���� ������ ���� �����ϵ��� �䱸�ؾ� �Ѵ�.
- ���� ���� ���ο����� ������ �� `submitFinalScoreOnce(finalScore)`�� ���� ���� ���� ó�� �Լ��� �ΰ� ��� ���� �бⰡ �� �Լ��� ����ϵ��� �����Ѵ�.
- Ŭ���̾�Ʈ �긮���� 2�� �̳� ���� ���� �ߺ� ������ ����, ���� ������ 15�� �̳� ���� �̸������� ���� �ߺ� ������ ���´�.
- AI ���� ������ �ش� �긮���� �ڵ� ����
- ���� ���ε� ���ӵ� ���� �긮���� ����� �� �־�� ��
- iframe DOM ��ĵ ��� ���� ������ ���� �������� ���� �����ϳ�, ���� ���� ����� �긮�� �Լ��� ����
- Ȩ è�Ǿ� ��Ʈ���� �ڵ� �̵��� drag �̵��� ��� �����ؾ� �Ѵ�.
- Ȩ è�Ǿ� ��Ʈ���� drag ���Ŀ��� click �� �����ϰ�, �Ϲ� click/tap �� ���� �� �̵����� �����ؾ� �Ѵ�.

### 11.6 AI ���⹰ ���� ����

- `lib/games/ai-playability.ts` ���� ���� ������� AI ����/���� HTML�� ���� ���� �˻��Ѵ�.
- ������� inline script ����, DOMContentLoaded/load, ���� ��ư Ŭ��, timer/animation frame flush �� ������ �ּ� ��Ÿ�� ����ũ �׽�Ʈ�� �����Ѵ�.
- ���� ��ư �Ǵ� ������ ���� ��� �ִ� ������ Ŭ�� ���� ���� �÷��� ���� �Ǵ� �Է� �帧�� ���۵Ǵ������� Ȯ���ؾ� �Ѵ�.
- �ܺ� script ����, ���� ����, ��� ��Ÿ�� ����, ���� ����/ĵ����/�Է� �ʱ�ȭ ����� ���з� ó���Ѵ�.
- ���� �� �����⿡�� ��õ� ������Ʈ�� �߰��ϰ�, �ִ� ��õ� �Ŀ��� �����ϸ� ����ڿ��� ������ ��ȯ�Ѵ�.


### 11.7 ����Ʈ ����/���� ��Ģ

- ��� ����Ʈ ��ȭ�� `user_point_ledger`�� ����Ѵ�.
- AI ����/���� ������ �������� ���� �����Ѵ�.
- �÷��� ����Ʈ ������ ���� ���Ӱ� ���� �÷��̿��� �����Ѵ�.
- ������ ���� ����Ʈ�� grant �̺�Ʈ Ȯ�� �Ŀ��� �����Ѵ�.
- ���� ����Ʈ�� ���� ���� �Ŀ��� �����Ѵ�.
- ���� �̺�Ʈ�� �ߺ� ������ ���� ���� source ��� idempotency�� �ʿ��ϴ�.

### 11.8 ���� ���� ��Ģ

- �Ϲ� ����Ʈ ����� Google ���� �������� �����Ѵ�.
- �Ƶ� ��� ���� Ư���� ad request���� child-directed treatment�� �ݿ��ؾ� �Ѵ�.
- 13�� �̸� �Ǵ� �Ƶ� ��� Ȱ���� ������� ����ȭ ����� ������� �ʴ´�.
- �� ������ ����� GPT rewarded �帧ó�� ���� ȯ�濡���� ��û�ϰ�, ������ �� graceful fallback �ؾ� �Ѵ�.
- ������ ����� ����� ���� �� ǥ���ؾ� �Ѵ�.

### 11.9 �ؽ�Ʈ ������ �� tooltip ��Ģ

- Ȩ ���� ī�� ����� �ۼ��ڸ��� 1�� ������ ó���Ѵ�.
- ������ ��� �ؽ�Ʈ�� `title` �Ӽ� �Ǵ� ���� tooltip���� ������ �����Ѵ�.
- ���� �� �׼� ��ư�� ���콺 hover�� Ű���� focus���� ��ɸ��� Ȯ���� �� �־�� �Ѵ�.
- �α���/ȸ������ ���� �޽����� ���� locale�� �´� ������ ������ ���� ��Ÿ�Ϸ� �����Ѵ�.
- �� ���� AI ���� �Ϸ� �Ŀ��� ��� ī��� `/my-games?notice=updated` ���� �޽��� �� �� ���� �Ϸ� ������ �����ؾ� �Ѵ�.

### 11.10 ���� ��Ÿ������ ��Ģ

- ��Ʈ ���̾ƿ� ��Ÿ�����ʹ� `metadataBase`, canonical, Open Graph, Twitter card �� �����ؾ� �Ѵ�.
- ��Ʈ URL�� �⺻ ���� �̹����� �Ƶ� ģȭ���� ���� ����Ŀ �������� ��ǥ Open Graph �̹����� �����Ѵ�.
- ���� �� �������� `generateMetadata`�� ���Ӹ�, ����, canonical, ���� ����� ��� Open Graph/Twitter ��Ÿ�����͸� �����Ѵ�.
- ���� ������� ������ ��Ʈ�� ������ ��ǥ Open Graph �̹����� fallback ���� �̹����� ����Ѵ�.
- ���� �� ���� ��ư�� ��ũ ���� �ȳ��� ��ư �ٷ� �Ʒ��� ��� ǥ���� �� �ڵ����� �����.

## 12. ����/���� ����

### 12.1 ��Ű

- ����, ����, �÷��� ���迡 `httpOnly` ��Ű ���
- � ȯ�濡�� `secure: true`
- `sameSite: lax`

### 12.2 �ڻ� ���� ����

- ���� ������ ���� ����
- ���� ������ ������ ���� ����
- �ʾ�/���� ������ �ۼ��� �Ǵ� �����ڸ� ����
- HTML �ڻ� ���信�� CSP ��� �߰�

### 12.3 iframe ���� ��å

���� iframe sandbox:

- `allow-scripts`
- `allow-same-origin`
- `allow-pointer-lock`

### 12.4 ����/����Ʈ ������ġ

- ����Ʈ ������ Ŭ���̾�Ʈ�� �ƴ϶� ������ ����
- ���� ���� �� ������ ����
- ���� ���� �̺�Ʈ �ߺ� ���� ����
- AI ��û ���� �� ����Ʈ ȯ��/���� ��å�� �и� ����

### 12.5 ���� ��Ģ

- ������� �ʴ� Turnstile, blocklist, filesystem fallback�� ���� ���θ� ���� �����ϰ�, ���� ��ġ�� ������ �ڵ忡�� �����Ѵ�.
- ���Ž� ��������Ʈ�� ���ܵα⺸�� ���� ��å���� �����Ѵ�.

## 13. �׽�Ʈ ����

�ʼ� ���� ����:

- ��� ������ �켱����
  - �˻�â ���
  - `Create Game` ��ư �ٹٲ� ����
  - ��� ����Ʈ ��ư ����
- Ȩ �˻� live filtering
  - ���� ����
  - �ۼ��� ����
  - �Է� ��� �ݿ�
- Ȩ è�Ǿ� ��Ʈ��
  - ��� ��ġ
  - �ڵ� �̵�
  - ���콺 drag
  - ��ġ drag
  - drag ���� ���� click/tap �� ���� �� �̵�
- ���� ī�� ������ �� tooltip
  - ���� 1��
  - �ۼ��� 1��
- �α���/ȸ������ �ܼ�ȭ ���̾ƿ�
- �ߺ� ID ���� locale �ݿ� �� ������ ǥ��
- ZIP �˻�
  - �ܺ� ����� �Է� ���� ȸ��
- ���� ���ε� �������� on/off
- AI ����/���� �� ����, ����, ��� ī�� �ϰ���
- AI ����/���� ������Ʈ ���ø�
  - �ý��� ������Ʈ �ʼ� ��Ģ ����
  - ����� ������Ʈ placeholder ����
  - �������� ����/����� ���� ���� ���� ����
- AI ����/���� �����Ȳ UI
- ����/���� ��� ���� �⺻ ���� ����
- AI ����/���� ���� ����ũ �׽�Ʈ
  - ���� ���� ����
  - ��� ��Ÿ�� ���� ����
  - ���� ��ư/���� �ʱ�ȭ Ȯ��
  - ���� ��ư Ŭ�� ���� ���� �÷��� ���� Ȯ��
- ���� ���� �������� ����
  - �й� �� ����
  - �¸� �� ����
  - Ŭ����/Ÿ�Ӿƿ� �� ����
  - ���� �ʱ�ȭ ���� ����� �� ����
- AI ���� �Ϸ� �ȳ�
  - ���� �Ϸ� ī��
  - `/my-games` updated notice
- ���� �� �׼� tooltip
- ���� �� ��������
  - ����/���� ī�� �Ʒ� ��ġ
  - ���� 10���� ����
  - ������ `#` �̻��
  - �ߺ� ����/���� ����
- ���� ��Ÿ������
  - ��Ʈ URL �ΰ� �����
  - ���� URL ���� ����� �켱
- �ۼ��� ����/���� �帧
- ������ ����Ʈ ����� ǥ�� �� �ܼ�ȭ ���̾ƿ�
- ����Ʈ ���� ī�� 3�� ����
- ���ڵ� ���� �� �ѱ��� UI ȸ�� Ȯ��
- �÷��� �� ������ IP �ؽ� ����
- ���� ������ ���� ���� UI�� ������ �ʴ��� Ȯ��

## 14. ���� �ڵ���� �ֿ� ��

���� �ڵ�� ��ǥ ���Ǽ� ������ ū ���̴� ������ ����.

- ����� ����Ʈ ��ư�� ���� �ְ�, ���� ȭ�鿡�� `Create Game` ��ư�� �˻�â �켱������ ���� ����
- Ȩ �˻��� live filtering�� �ƴ϶� ������ �����̸� �˻� ���ص� ���� ��ǥ�� �ٸ�
- Ȩ è�Ǿ� ��Ʈ���� ���� �׸��� �Ʒ��� �ְ� ������� ������ �� drag ��ȣ�ۿ��� ����
- ���� ī�� ����/�ۼ��� �����Ӱ� tooltip ��Ģ�� ����
- �α��� ȭ�鿡 ���� ���� ī�尡 �ְ� ī�� ���� `Login` ���� �� ���� ������ ���� ����
- ���� ���� locale ó���� ���� �ѱ��� ������ �������� ����
- ȸ������ �ߺ� ID ������ ���� ���� �����ϰ� �ϰ����� ����
- ���� ȭ���� `How it works`, AI �� ����, cost card, ��� ���� ���� UX�� ��ǥ ���ؿ� ��ġ�� ����
- AI ���� ����/���� ������Ʈ�� ���� ������ ǥ�� system/user ���ø����� �����Ǿ� ���� �ʰ�, ������ ���� �帮��Ʈ ���ɼ��� ���� ����
- ���� ���� ���ο� ���� �ʱ�ȭ ���� ����۱��� �����ϴ� �������� ���� �Ծ��� ���� ������ ���� ��� �������� ������ �����Ǿ� ���� ����
- ZIP ���ε忡�� �ܺ� ����� �Է� ���� ��å�� �ݿ����� ����
- ���� ȭ���� �Է� ����, AI ��� �켱����, �ϴ� ��ư ������ ��ǥ�� �ٸ�
- ���� �� �׼� ��ư�� ����� tooltip�� ����
- �� ���� ȭ���� `Move to Draft` �߽��̸� �ۼ��� ���� �帧�� danger delete ��Ÿ���� ����
- ������ ȭ�� ��� ������ ���ϰ� ������� ��Ͽ� ǥ�õ��� ����
- ����Ʈ ���� ī�尡 3�� ���� ������ �������� ����

�� ���� �޿�� �۾� ����� ���� �������� �����Ѵ�.

