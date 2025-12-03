export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool.execute(args);
  }
}

// --- Concrete Tool Implementations ---

import * as monthUtils from '../../shared/months';
import { q } from '../../shared/query';
import { integerToAmount } from '../../shared/util';
import { categoryGroupModel, categoryModel } from '../api-models';
import { aqlQuery } from '../aql';
import { envelopeBudgetMonth, trackingBudgetMonth } from '../budget/app';
import { getBudgetType } from '../budget/base';
import * as db from '../db';

export const getBudgetMonthTool: Tool = {
  name: 'get_budget_month',
  description: 'Get the budget details for a specific month (format: YYYY-MM)',
  parameters: {
    type: 'object',
    properties: {
      month: { type: 'string', description: 'The month to retrieve (YYYY-MM)' },
    },
    required: ['month'],
  },
  execute: async ({ month }: { month: string }) => {
    const type = getBudgetType();
    let values: { value: number | string | boolean; name: string }[];

    if (type === 'envelope') {
      values = await envelopeBudgetMonth({ month });
    } else {
      values = await trackingBudgetMonth({ month });
    }

    const sheetName = monthUtils.sheetForMonth(month);

    function value(name: string) {
      const fullName = `${sheetName}!${name}`;
      const v = values.find(v => v.name === fullName);
      if (!v) return 0;
      return typeof v.value === 'number' ? integerToAmount(v.value) : v.value;
    }

    const { data: groups } = await aqlQuery(
      q('category_groups').select('*')
    );

    return {
      month,
      type,
      incomeAvailable: value('available-funds') as number,
      lastMonthOverspent: value('last-month-overspent') as number,
      forNextMonth: value('buffered') as number,
      totalBudgeted: value('total-budgeted') as number,
      toBudget: value('to-budget') as number,

      fromLastMonth: value('from-last-month') as number,
      totalIncome: value('total-income') as number,
      totalSpent: value('total-spent') as number,
      totalBalance: value('total-leftover') as number,

      categoryGroups: groups.map((group: any) => {
        if (group.is_income) {
          return {
            ...categoryGroupModel.toExternal(group),
            received: value(`total-income`),
            categories: (group.categories || []).map((cat: any) => ({
              ...categoryModel.toExternal(cat),
              received: value(`sum-amount-${cat.id}`),
            })),
          };
        }

        return {
          ...categoryGroupModel.toExternal(group),
          budgeted: value(`group-budget-${group.id}`),
          spent: value(`group-sum-amount-${group.id}`),
          balance: value(`group-leftover-${group.id}`),

          categories: (group.categories || []).map((cat: any) => ({
            ...categoryModel.toExternal(cat),
            budgeted: value(`budget-${cat.id}`),
            spent: value(`sum-amount-${cat.id}`),
            balance: value(`leftover-${cat.id}`),
            carryover: value(`carryover-${cat.id}`),
          })),
        };
      }),
    };
  },
};

export const runAQLQueryTool: Tool = {
  name: 'run_aql_query',
  description: 'Run an AQL (Actual Query Language) query to retrieve data',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'object', description: 'The AQL query object' },
    },
    required: ['query'],
  },
  execute: async ({ query }: { query: any }) => {
    return await aqlQuery(query);
  },
};
