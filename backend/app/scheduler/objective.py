from app.core.config import settings

def apply_soft_constraints(solver):
    model = solver.model
    X = solver.X
    time_slots = [t for t in solver.time_slots if not t.is_break]
    assignments = solver.assignments
    
    # We define weights
    WEIGHT_GAP = 10
    WEIGHT_MULTIPLE_SESSIONS = 5
    WEIGHT_TEACHER_OVERLOAD = 5
    
    penalties = []
    
    # Organize slots by day
    days = {}
    for t in time_slots:
        days.setdefault(t.day, []).append(t)
    for d in days:
        days[d].sort(key=lambda x: x.period)
        
    # Group assignments by class
    classes = {}
    for a in assignments:
        classes.setdefault(a.class_id, []).append(a)

    # 1. Minimize class gaps (empty periods between scheduled periods for a class)
    # For a class on a given day, a gap happens if it has class at t1 and t3, but not at t2
    if settings.MINIMIZE_CLASS_GAPS:
        for c_id, asgns in classes.items():
            for day, slots in days.items():
                if len(slots) < 3: continue
                # is_active[t] = 1 if any subject is scheduled at slot t for class c_id
                is_active = []
                for t in slots:
                    act = model.NewBoolVar(f"class_{c_id}_{day}_t{t.id}_active")
                    # act == 1 if sum(X[(a.id, t.id)]) > 0
                    model.AddMaxEquality(act, [X[(a.id, t.id)] for a in asgns])
                    is_active.append(act)
                
                # Gap at index i (0 < i < len-1): active at i-1, not active at i, active at i+1
                for i in range(1, len(slots) - 1):
                    gap_var = model.NewBoolVar(f"gap_c{c_id}_{day}_{i}")
                    # gap_var is 1 if (is_active[i-1]==1 and is_active[i]==0 and is_active[i+1]==1)
                    # We can use a linear constraint: gap_var >= is_active[i-1] + (1 - is_active[i]) + is_active[i+1] - 2
                    model.Add(gap_var >= is_active[i-1] - is_active[i] + is_active[i+1] - 1)
                    # We penalize gap_var
                    penalties.append(WEIGHT_GAP * gap_var)
                    
    # 2. Distribute weekly classes
    # Avoid putting > 1 session of the same subject on one day
    if settings.BALANCE_SUBJECTS:
        for a in assignments:
            if a.weekly_periods <= 1 or a.is_lab: continue
            for day, slots in days.items():
                sessions_on_day = sum(X[(a.id, t.id)] for t in slots)
                # We want to penalize sessions_on_day > 1
                # diff = max(0, sessions_on_day - 1)
                diff = model.NewIntVar(0, len(slots), f"diff_subj_a{a.id}_{day}")
                model.Add(diff >= sessions_on_day - 1)
                penalties.append(WEIGHT_MULTIPLE_SESSIONS * diff)

    # 3. Teacher workload distribution
    if settings.BALANCE_TEACHER_WORKLOAD:
        # Group by teacher
        teacher_assignments = {}
        for a in assignments:
            for tr in [a.teacher_id] + a.assistant_ids:
                teacher_assignments.setdefault(tr, []).append(a)
                
        for tr_id, asgns in teacher_assignments.items():
            for day, slots in days.items():
                daily_load = sum(X[(a.id, t.id)] for a in asgns for t in slots)
                # Penalize if daily load > 4
                overload = model.NewIntVar(0, len(slots), f"overload_tr{tr_id}_{day}")
                model.Add(overload >= daily_load - 4)
                penalties.append(WEIGHT_TEACHER_OVERLOAD * overload)

    if penalties:
        model.Minimize(sum(penalties))
