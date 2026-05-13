// التحقق من توقيعات GitHub Webhooks ومعالجة الأحداث
// يدعم أحداث: Push, PullRequest, Issues, WorkflowRun
// يستخدم HMAC-SHA256 للتحقق من صحة التوقيعات

import { createHmac, timingSafeEqual } from "crypto";

// ==================== أنواع الأحداث ====================

/** حدث الدفع - عند دفع تغييرات إلى المستودع */
export interface PushEvent {
  /** نوع الحدث */
  type: "push";
  /** اسم المستودع */
  repository: string;
  /** مالك المستودع */
  owner: string;
  /** اسم الفرع الم pushed إليه */
  ref: string;
  /** قائمة التغييرات المدفوعة */
  commits: Array<{
    /** معرف التغيير */
    id: string;
    /** رسالة التغيير */
    message: string;
    /** المؤلف */
    author: {
      name: string;
      email: string;
    };
    /** الطابع الزمني */
    timestamp: string;
    /** الملفات المضافة */
    added: string[];
    /** الملفات المحذوفة */
    removed: string[];
    /** الملفات المعدلة */
    modified: string[];
  }>;
  /** اسم المستخدم الذي قام بالدفع */
  sender: string;
}

/** حدث طلب السحب */
export interface PullRequestEvent {
  /** نوع الحدث */
  type: "pull_request";
  /** الإجراء: فتح، إغلاق، دمج، إعادة فتح، مزامنة */
  action: "opened" | "closed" | "reopened" | "synchronize" | "edited" | "labeled" | "unlabeled";
  /** رقم طلب السحب */
  number: number;
  /** عنوان طلب السحب */
  title: string;
  /** وصف طلب السحب */
  body: string | null;
  /** اسم المستودع */
  repository: string;
  /** مالك المستودع */
  owner: string;
  /** الفرع المصدر */
  headBranch: string;
  /** الفرع الهدف */
  baseBranch: string;
  /** حالة الدمج */
  merged: boolean;
  /** اسم المستخدم الذي أنشأ الطلب */
  sender: string;
  /** هل الطلب مفتوح */
  draft: boolean;
}

/** حدث المشاكل/القضايا */
export interface IssuesEvent {
  /** نوع الحدث */
  type: "issues";
  /** الإجراء: فتح، إغلاق، إعادة فتح، تعيين، تسمية */
  action: "opened" | "closed" | "reopened" | "assigned" | "unassigned" | "labeled" | "unlimited" | "edited" | "pinned" | "unpinned";
  /** رقم المشكلة */
  number: number;
  /** عنوان المشكلة */
  title: string;
  /** وصف المشكلة */
  body: string | null;
  /** اسم المستودع */
  repository: string;
  /** مالك المستودع */
  owner: string;
  /** حالة المشكلة */
  state: "open" | "closed";
  /** التسميات */
  labels: string[];
  /** اسم المستخدم الذي أنشأ المشكلة */
  sender: string;
}

/** حدث تشغيل سير العمل */
export interface WorkflowRunEvent {
  /** نوع الحدث */
  type: "workflow_run";
  /** الإجراء: مكتمل، قيد التشغيل */
  action: "completed" | "requested" | "in_progress";
  /** اسم سير العمل */
  name: string;
  /** معرف التشغيل */
  runId: number;
  /** رقم التشغيل */
  runNumber: number;
  /** حالة التشغيل */
  status: "queued" | "in_progress" | "completed" | "waiting";
  /** نتيجة التشغيل */
  conclusion: "success" | "failure" | "cancelled" | "timed_out" | null;
  /** اسم المستودع */
  repository: string;
  /** مالك المستودع */
  owner: string;
  /** الفرع */
  branch: string;
  /** الطابع الزمني */
  createdAt: string;
  /** وقت التحديث */
  updatedAt: string;
  /** اسم المستخدم الذي قام بالتشغيل */
  sender: string;
}

/** اتحاد أنواع أحداث الويب هوك */
export type WebhookEvent =
  | PushEvent
  | PullRequestEvent
  | IssuesEvent
  | WorkflowRunEvent;

/** نتيجة تحليل الحدث */
export interface ParsedWebhookResult {
  /** هل تم التحليل بنجاح */
  success: boolean;
  /** الحدث المحلل (إن وجد) */
  event: WebhookEvent | null;
  /** رسالة الخطأ (إن وجدت) */
  error?: string;
}

// ==================== دوال التحقق ====================

/**
 * التحقق من توقيع الويب هوك باستخدام HMAC-SHA256
 * يضمن أن الطلب قادم فعلاً من GitHub ولم يتم التلاعب به
 * يستخدم مقارنة آمنة زمنياً لمنع هجمات التوقيت
 * @param payload - محتوى الطلب كنص خام
 * @param signature - توقيع GitHub المرسل في ترويسة X-Hub-Signature-256
 * @param secret - السر المشترك بين GitHub والتطبيق
 * @returns صحيح إذا كان التوقيع صالحاً، خاطئ إذا لم يكن
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // حساب التوقيع المتوقع باستخدام HMAC-SHA256
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // إضافة البادئة sha256= إذا لم تكن موجودة في التوقيع المرسل
    const fullExpectedSignature = signature.startsWith("sha256=")
      ? expectedSignature
      : expectedSignature;

    const fullReceivedSignature = signature.startsWith("sha256=")
      ? signature.slice(7)
      : signature;

    // مقارنة آمنة زمنياً لمنع هجمات التوقيت
    const expectedBuffer = Buffer.from(fullExpectedSignature, "hex");
    const receivedBuffer = Buffer.from(fullReceivedSignature, "hex");

    // التحقق من تساوي أطوال المخازن المؤقتة
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    // مقارنة آمنة زمنياً
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    // أي خطأ في التحقق يعني فشل المصادقة
    return false;
  }
}

// ==================== دوال التحليل ====================

/**
 * استخراج بيانات حدث الدفع من الحمولة
 * @param payload - بيانات الحدث الخام
 * @returns حدث الدفع المنظم
 */
function parsePushEvent(payload: Record<string, unknown>): PushEvent {
  return {
    type: "push",
    ref: (payload.ref as string) || "",
    repository:
      (payload.repository as Record<string, unknown>)?.name as string || "",
    owner:
      ((payload.repository as Record<string, unknown>)?.owner as Record<string, unknown>)?.login as string || "",
    commits: ((payload.commits as Array<Record<string, unknown>>) || []).map(
      (commit) => ({
        id: (commit.id as string) || "",
        message: (commit.message as string) || "",
        author: {
          name: (commit.author as Record<string, unknown>)?.name as string || "",
          email: (commit.author as Record<string, unknown>)?.email as string || "",
        },
        timestamp: (commit.timestamp as string) || "",
        added: (commit.added as string[]) || [],
        removed: (commit.removed as string[]) || [],
        modified: (commit.modified as string[]) || [],
      })
    ),
    sender: (payload.sender as Record<string, unknown>)?.login as string || "",
  };
}

/**
 * استخراج بيانات حدث طلب السحب من الحمولة
 * @param payload - بيانات الحدث الخام
 * @returns حدث طلب السحب المنظم
 */
function parsePullRequestEvent(
  payload: Record<string, unknown>
): PullRequestEvent {
  const pr = (payload.pull_request as Record<string, unknown>) || {};
  return {
    type: "pull_request",
    action: (payload.action as PullRequestEvent["action"]) || "opened",
    number: (pr.number as number) || 0,
    title: (pr.title as string) || "",
    body: (pr.body as string) || null,
    repository:
      (payload.repository as Record<string, unknown>)?.name as string || "",
    owner:
      ((payload.repository as Record<string, unknown>)?.owner as Record<string, unknown>)?.login as string || "",
    headBranch: (pr.head as Record<string, unknown>)?.ref as string || "",
    baseBranch: (pr.base as Record<string, unknown>)?.ref as string || "",
    merged: (pr.merged as boolean) || false,
    sender: (payload.sender as Record<string, unknown>)?.login as string || "",
    draft: (pr.draft as boolean) || false,
  };
}

/**
 * استخراج بيانات حدث المشاكل من الحمولة
 * @param payload - بيانات الحدث الخام
 * @returns حدث المشاكل المنظم
 */
function parseIssuesEvent(payload: Record<string, unknown>): IssuesEvent {
  const issue = (payload.issue as Record<string, unknown>) || {};
  const labels = ((issue.labels as Array<Record<string, unknown>>) || []).map(
    (label) => (label.name as string) || ""
  );
  return {
    type: "issues",
    action: (payload.action as IssuesEvent["action"]) || "opened",
    number: (issue.number as number) || 0,
    title: (issue.title as string) || "",
    body: (issue.body as string) || null,
    repository:
      (payload.repository as Record<string, unknown>)?.name as string || "",
    owner:
      ((payload.repository as Record<string, unknown>)?.owner as Record<string, unknown>)?.login as string || "",
    state: (issue.state as "open" | "closed") || "open",
    labels,
    sender: (payload.sender as Record<string, unknown>)?.login as string || "",
  };
}

/**
 * استخراج بيانات حدث تشغيل سير العمل من الحمولة
 * @param payload - بيانات الحدث الخام
 * @returns حدث تشغيل سير العمل المنظم
 */
function parseWorkflowRunEvent(
  payload: Record<string, unknown>
): WorkflowRunEvent {
  const workflowRun =
    (payload.workflow_run as Record<string, unknown>) || {};
  return {
    type: "workflow_run",
    action: (payload.action as WorkflowRunEvent["action"]) || "completed",
    name: (workflowRun.name as string) || "",
    runId: (workflowRun.id as number) || 0,
    runNumber: (workflowRun.run_number as number) || 0,
    status: (workflowRun.status as WorkflowRunEvent["status"]) || "queued",
    conclusion:
      (workflowRun.conclusion as WorkflowRunEvent["conclusion"]) || null,
    repository:
      (payload.repository as Record<string, unknown>)?.name as string || "",
    owner:
      ((payload.repository as Record<string, unknown>)?.owner as Record<string, unknown>)?.login as string || "",
    branch: (workflowRun.head_branch as string) || "",
    createdAt: (workflowRun.created_at as string) || "",
    updatedAt: (workflowRun.updated_at as string) || "",
    sender: (payload.sender as Record<string, unknown>)?.login as string || "",
  };
}

/**
 * تحليل حدث الويب هوك من الحمولة الخام
 * يحدد نوع الحدث ويستخرج البيانات المناسبة
 * @param payload - حمولة الحدث الخام (كائن JSON)
 * @returns نتيجة التحليل مع الحدث المنظم أو رسالة خطأ
 */
export function parseWebhookEvent(payload: unknown): ParsedWebhookResult {
  try {
    // التحقق من أن الحمولة كائن صالح
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        event: null,
        error: "الحمولة غير صالحة: يجب أن تكون كائن JSON",
      };
    }

    const data = payload as Record<string, unknown>;

    // تحديد نوع الحدث بناءً على الحقول الموجودة
    // حدث الدفع - يحتوي على حقل ref و commits
    if (data.ref && Array.isArray(data.commits)) {
      return {
        success: true,
        event: parsePushEvent(data),
      };
    }

    // حدث طلب السحب - يحتوي على حقل pull_request
    if (data.pull_request) {
      return {
        success: true,
        event: parsePullRequestEvent(data),
      };
    }

    // حدث المشاكل - يحتوي على حقل issue بدون pull_request
    if (data.issue && !data.pull_request) {
      return {
        success: true,
        event: parseIssuesEvent(data),
      };
    }

    // حدث تشغيل سير العمل - يحتوي على حقل workflow_run
    if (data.workflow_run) {
      return {
        success: true,
        event: parseWorkflowRunEvent(data),
      };
    }

    // نوع حدث غير مدعوم
    return {
      success: false,
      event: null,
      error: "نوع الحدث غير مدعوم أو لا يمكن تحديده",
    };
  } catch (error) {
    // خطأ أثناء التحليل
    const message =
      error instanceof Error ? error.message : "خطأ غير معروف في التحليل";
    return {
      success: false,
      event: null,
      error: `فشل تحليل الحدث: ${message}`,
    };
  }
}
